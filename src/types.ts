export type Item = {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'lost' | 'found';
  status: 'open' | 'in_progress' | 'resolved';
  location: string;
  date: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  item_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  student_id: string;
  department: string;
  phone: string;
  year_of_study: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

export type ItemClaim = {
  id: string;
  item_id: string;
  claimed_by: string;
  claim_date: string;
  proof_of_ownership: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
};