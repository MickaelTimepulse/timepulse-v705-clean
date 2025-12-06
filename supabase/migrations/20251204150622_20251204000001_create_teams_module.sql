/*
  # Module Équipes / Relais (Teams Module)

  1. New Tables
    - `teams` - Équipes pour courses relais/ekiden
    - `team_members` - Membres des équipes
    - `team_invitations` - Invitations pour rejoindre équipes

  2. Functions
    - `generate_team_invitation_code()` - Génère code unique
    - `check_team_documents_status()` - Vérifie statut documents
    - `update_team_status()` - Met à jour statut équipe
    - `assign_team_bib_numbers()` - Assigne dossards équipe

  3. Security
    - Enable RLS on all tables
    - Policies for captains to manage their teams
    - Policies for organizers to manage all teams
    - Public read for invitation verification

  4. Triggers
    - Update team member count on insert/delete
    - Update team status when documents change
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id uuid REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  team_type text NOT NULL DEFAULT 'mixte',
  captain_entry_id uuid REFERENCES entries(id) ON DELETE SET NULL,
  captain_email text,
  captain_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'incomplete', 'complete', 'validated', 'cancelled')),
  min_members integer NOT NULL DEFAULT 2 CHECK (min_members >= 2),
  max_members integer NOT NULL DEFAULT 6 CHECK (max_members >= min_members),
  current_members_count integer NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT 'team' CHECK (payment_mode IN ('team', 'individual')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  total_amount decimal(10,2) DEFAULT 0,
  bib_numbers text[] DEFAULT '{}',
  can_modify_until timestamptz,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES entries(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  position integer CHECK (position >= 1),
  status text NOT NULL DEFAULT 'joined' CHECK (status IN ('invited', 'joined', 'documents_pending', 'documents_complete', 'validated', 'removed')),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, entry_id),
  UNIQUE(team_id, position)
);

-- Create team_invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  invitation_code text UNIQUE NOT NULL,
  email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'cancelled')),
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses >= 0),
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_by uuid REFERENCES entries(id),
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_race_id ON teams(race_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain ON teams(captain_entry_id);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_captain_email ON teams(captain_email);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_entry ON team_members(entry_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_code ON team_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status, expires_at);

-- Function: Generate unique team invitation code
CREATE OR REPLACE FUNCTION generate_team_invitation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM team_invitations WHERE invitation_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Function: Check team documents status
CREATE OR REPLACE FUNCTION check_team_documents_status(team_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  total_members integer;
  members_with_complete_docs integer;
BEGIN
  SELECT COUNT(*) INTO total_members
  FROM team_members tm
  WHERE tm.team_id = team_id_param AND tm.status != 'removed';

  SELECT COUNT(DISTINCT tm.entry_id) INTO members_with_complete_docs
  FROM team_members tm
  INNER JOIN entries e ON e.id = tm.entry_id
  WHERE tm.team_id = team_id_param
    AND tm.status != 'removed'
    AND NOT EXISTS (
      SELECT 1
      FROM races r
      WHERE r.id = (SELECT race_id FROM teams WHERE id = team_id_param)
        AND r.requires_license = true
        AND e.license_verified = false
    );

  result := jsonb_build_object(
    'total_members', total_members,
    'members_with_complete_docs', members_with_complete_docs,
    'all_complete', total_members > 0 AND total_members = members_with_complete_docs
  );

  RETURN result;
END;
$$;

-- Function: Update team status
CREATE OR REPLACE FUNCTION update_team_status(team_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  team_record teams%ROWTYPE;
  docs_status jsonb;
  new_status text;
BEGIN
  SELECT * INTO team_record FROM teams WHERE id = team_id_param;
  IF NOT FOUND THEN RETURN; END IF;

  docs_status := check_team_documents_status(team_id_param);

  IF team_record.current_members_count < team_record.min_members THEN
    new_status := 'incomplete';
  ELSIF team_record.current_members_count >= team_record.min_members THEN
    IF (docs_status->>'all_complete')::boolean THEN
      IF team_record.payment_status = 'paid' THEN
        new_status := 'validated';
      ELSE
        new_status := 'complete';
      END IF;
    ELSE
      new_status := 'complete';
    END IF;
  ELSE
    new_status := 'pending';
  END IF;

  UPDATE teams
  SET status = new_status, updated_at = now()
  WHERE id = team_id_param AND status != new_status;
END;
$$;

-- Function: Assign bib numbers to team
CREATE OR REPLACE FUNCTION assign_team_bib_numbers(
  team_id_param uuid,
  start_bib integer
)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  bib_array text[];
  member_record RECORD;
  suffix text;
BEGIN
  bib_array := ARRAY[]::text[];

  FOR member_record IN
    SELECT tm.entry_id, tm.position
    FROM team_members tm
    WHERE tm.team_id = team_id_param AND tm.status != 'removed'
    ORDER BY tm.position ASC NULLS LAST, tm.joined_at ASC
  LOOP
    suffix := chr(64 + (array_length(bib_array, 1) + 1));
    bib_array := array_append(bib_array, start_bib::text || '-' || suffix);

    UPDATE entries
    SET bib_number = start_bib::text || '-' || suffix
    WHERE id = member_record.entry_id;
  END LOOP;

  UPDATE teams
  SET bib_numbers = bib_array, updated_at = now()
  WHERE id = team_id_param;

  RETURN bib_array;
END;
$$;

-- Trigger: Update team member count
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE teams
    SET current_members_count = (
      SELECT COUNT(*)
      FROM team_members
      WHERE team_id = NEW.team_id AND status != 'removed'
    ),
    updated_at = now()
    WHERE id = NEW.team_id;
    PERFORM update_team_status(NEW.team_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE teams
    SET current_members_count = (
      SELECT COUNT(*)
      FROM team_members
      WHERE team_id = OLD.team_id AND status != 'removed'
    ),
    updated_at = now()
    WHERE id = OLD.team_id;
    PERFORM update_team_status(OLD.team_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_team_member_count
AFTER INSERT OR UPDATE OR DELETE ON team_members
FOR EACH ROW
EXECUTE FUNCTION update_team_member_count();

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_teams_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION update_teams_timestamp();

CREATE TRIGGER trigger_team_members_updated_at
BEFORE UPDATE ON team_members
FOR EACH ROW
EXECUTE FUNCTION update_teams_timestamp();

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Public can view validated teams"
  ON teams FOR SELECT
  TO public
  USING (status = 'validated');

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team captains can update their teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    captain_entry_id IN (
      SELECT e.id FROM entries e
      INNER JOIN athletes a ON a.id = e.athlete_id
      WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND (can_modify_until IS NULL OR can_modify_until > now())
  );

CREATE POLICY "Team captains can delete pending teams"
  ON teams FOR DELETE
  TO authenticated
  USING (
    captain_entry_id IN (
      SELECT e.id FROM entries e
      INNER JOIN athletes a ON a.id = e.athlete_id
      WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND status = 'pending'
  );

CREATE POLICY "Organizers can manage all teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    race_id IN (
      SELECT r.id FROM races r
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for team_members
CREATE POLICY "Public can view team members of validated teams"
  ON team_members FOR SELECT
  TO public
  USING (
    team_id IN (SELECT id FROM teams WHERE status = 'validated')
  );

CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    entry_id IN (
      SELECT e.id FROM entries e
      INNER JOIN athletes a ON a.id = e.athlete_id
      WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    OR team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Captains can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Captains can update members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Captains can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Organizers can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      INNER JOIN races r ON r.id = t.race_id
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS Policies for team_invitations
CREATE POLICY "Public can view valid invitations"
  ON team_invitations FOR SELECT
  TO public
  USING (
    status = 'pending'
    AND expires_at > now()
    AND (max_uses = 0 OR current_uses < max_uses)
  );

CREATE POLICY "Captains can create invitations"
  ON team_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Captains can manage invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      WHERE t.captain_entry_id IN (
        SELECT e.id FROM entries e
        INNER JOIN athletes a ON a.id = e.athlete_id
        WHERE a.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Organizers can view invitations"
  ON team_invitations FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      INNER JOIN races r ON r.id = t.race_id
      INNER JOIN events e ON e.id = r.event_id
      INNER JOIN organizers o ON o.id = e.organizer_id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all invitations"
  ON team_invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );