export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'participant' | 'organizer' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'participant' | 'organizer' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'participant' | 'organizer' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          organization_type: 'association' | 'company' | 'individual'
          siret: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          website: string | null
          description: string | null
          logo_url: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name: string
          organization_type?: 'association' | 'company' | 'individual'
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          organization_type?: 'association' | 'company' | 'individual'
          siret?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          website?: string | null
          description?: string | null
          logo_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          name: string
          slug: string
          description: string | null
          event_type: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'walking' | 'other'
          location: string | null
          city: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          start_date: string
          end_date: string | null
          image_url: string | null
          image_position_x: number | null
          image_position_y: number | null
          banner_url: string | null
          website: string | null
          registration_opens: string
          registration_closes: string | null
          status: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          name: string
          slug: string
          description?: string | null
          event_type?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'walking' | 'other'
          location?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          start_date: string
          end_date?: string | null
          image_url?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          banner_url?: string | null
          website?: string | null
          registration_opens?: string
          registration_closes?: string | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          name?: string
          slug?: string
          description?: string | null
          event_type?: 'running' | 'trail' | 'triathlon' | 'cycling' | 'swimming' | 'obstacle' | 'walking' | 'other'
          location?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          start_date?: string
          end_date?: string | null
          image_url?: string | null
          image_position_x?: number | null
          image_position_y?: number | null
          banner_url?: string | null
          website?: string | null
          registration_opens?: string
          registration_closes?: string | null
          status?: 'draft' | 'published' | 'cancelled' | 'completed'
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      races: {
        Row: {
          id: string
          event_id: string
          name: string
          distance: number | null
          elevation_gain: number
          description: string | null
          start_time: string | null
          max_participants: number | null
          min_age: number
          max_age: number | null
          requires_license: boolean
          base_price: number
          status: 'active' | 'full' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          distance?: number | null
          elevation_gain?: number
          description?: string | null
          start_time?: string | null
          max_participants?: number | null
          min_age?: number
          max_age?: number | null
          requires_license?: boolean
          base_price?: number
          status?: 'active' | 'full' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          distance?: number | null
          elevation_gain?: number
          description?: string | null
          start_time?: string | null
          max_participants?: number | null
          min_age?: number
          max_age?: number | null
          requires_license?: boolean
          base_price?: number
          status?: 'active' | 'full' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      race_categories: {
        Row: {
          id: string
          race_id: string
          name: string
          code: string | null
          min_age: number
          max_age: number | null
          gender: 'M' | 'F' | 'mixed' | null
          price_modifier: number
        }
        Insert: {
          id?: string
          race_id: string
          name: string
          code?: string | null
          min_age?: number
          max_age?: number | null
          gender?: 'M' | 'F' | 'mixed' | null
          price_modifier?: number
        }
        Update: {
          id?: string
          race_id?: string
          name?: string
          code?: string | null
          min_age?: number
          max_age?: number | null
          gender?: 'M' | 'F' | 'mixed' | null
          price_modifier?: number
        }
      }
      registrations: {
        Row: {
          id: string
          race_id: string
          user_id: string | null
          category_id: string | null
          bib_number: number | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          date_of_birth: string | null
          gender: 'M' | 'F' | null
          nationality: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          medical_certificate_url: string | null
          license_number: string | null
          club_name: string | null
          tshirt_size: string | null
          price_paid: number
          payment_status: 'pending' | 'completed' | 'refunded' | 'cancelled'
          payment_intent_id: string | null
          registration_date: string
          status: 'confirmed' | 'pending' | 'cancelled'
          qr_code: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          race_id: string
          user_id?: string | null
          category_id?: string | null
          bib_number?: number | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          date_of_birth?: string | null
          gender?: 'M' | 'F' | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_certificate_url?: string | null
          license_number?: string | null
          club_name?: string | null
          tshirt_size?: string | null
          price_paid?: number
          payment_status?: 'pending' | 'completed' | 'refunded' | 'cancelled'
          payment_intent_id?: string | null
          registration_date?: string
          status?: 'confirmed' | 'pending' | 'cancelled'
          qr_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          user_id?: string | null
          category_id?: string | null
          bib_number?: number | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          date_of_birth?: string | null
          gender?: 'M' | 'F' | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          medical_certificate_url?: string | null
          license_number?: string | null
          club_name?: string | null
          tshirt_size?: string | null
          price_paid?: number
          payment_status?: 'pending' | 'completed' | 'refunded' | 'cancelled'
          payment_intent_id?: string | null
          registration_date?: string
          status?: 'confirmed' | 'pending' | 'cancelled'
          qr_code?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      results: {
        Row: {
          id: string
          registration_id: string
          race_id: string
          finish_time: string | null
          overall_rank: number | null
          category_rank: number | null
          gender_rank: number | null
          split_times: Json | null
          status: 'finished' | 'dnf' | 'dsq' | 'dns'
          created_at: string
        }
        Insert: {
          id?: string
          registration_id: string
          race_id: string
          finish_time?: string | null
          overall_rank?: number | null
          category_rank?: number | null
          gender_rank?: number | null
          split_times?: Json | null
          status?: 'finished' | 'dnf' | 'dsq' | 'dns'
          created_at?: string
        }
        Update: {
          id?: string
          registration_id?: string
          race_id?: string
          finish_time?: string | null
          overall_rank?: number | null
          category_rank?: number | null
          gender_rank?: number | null
          split_times?: Json | null
          status?: 'finished' | 'dnf' | 'dsq' | 'dns'
          created_at?: string
        }
      }
    }
  }
}
