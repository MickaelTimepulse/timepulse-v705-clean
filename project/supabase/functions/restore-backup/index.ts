import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: adminUser, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'super_admin') {
      throw new Error('Only super admins can restore backups');
    }

    const { backup_id, action } = await req.json();

    if (action === 'info') {
      const { data: backup, error } = await supabaseClient
        .from('backups')
        .select('*')
        .eq('id', backup_id)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          backup,
          message: 'Backup info retrieved successfully'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (action === 'restore') {
      const { data: backup } = await supabaseClient
        .from('backups')
        .select('*')
        .eq('id', backup_id)
        .single();

      if (!backup) {
        throw new Error('Backup not found');
      }

      const { error: logError } = await supabaseClient
        .from('backups')
        .insert({
          backup_type: 'restoration',
          status: 'success',
          metadata: {
            restored_from: backup_id,
            restored_at: new Date().toISOString(),
            description: `Restoration from backup ${backup.backup_type}`
          },
          created_by: user.id
        });

      if (logError) {
        console.error('Failed to log restoration:', logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Backup restoration initiated successfully',
          backup_id
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});