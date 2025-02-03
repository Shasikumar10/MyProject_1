// types.js

// Item object
export const Item = {
  id: '',
  title: '',
  description: '',
  category: '',
  type: 'lost',
  status: 'open',
  location: '',
  date: '',
  image_url: '',
  user_id: '',
  created_at: '',
  updated_at: '',
};

// Comment object
export const Comment = {
  id: '',
  item_id: '',
  user_id: '',
  content: '',
  created_at: '',
};

// Profile object
export const Profile = {
  id: '',
  full_name: '',
  student_id: '',
  department: '',
  phone: '',
  year_of_study: 0,
  avatar_url: '',
  created_at: '',
  updated_at: '',
};

// ItemClaim object
export const ItemClaim = {
  id: '',
  item_id: '',
  claimed_by: '',
  claim_date: '',
  proof_of_ownership: '',
  status: 'pending',
  admin_notes: '',
  created_at: '',
  updated_at: '',
};
