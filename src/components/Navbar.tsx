import { Link } from 'react-router-dom';
import { Search, PlusCircle, User } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificationBell } from './NotificationBell';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  const logoPath = '/assets/KLH_Logo.png';

  return (
    <motion.nav 
      className="bg-white border-b shadow-md"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <motion.img 
              src={logoPath} 
              alt="KLH Logo" 
              className="w-14 h-12 rounded-lg object-cover"
              whileHover={{ scale: 1.1 }}
            />
            <div>
              <motion.div 
                className="text-xl font-bold text-blue-600" 
                whileHover={{ scale: 1.1 }}
              >
                Lost and Found
              </motion.div>
              <div className="text-xs text-gray-500 -mt-1">Reuniting KLH's lost items with their owners</div>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <motion.button 
              className="flex items-center text-gray-700 hover:text-blue-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Search className="w-5 h-5" />
            </motion.button>

            {user ? (
              <>
                <Link to="/report">
                  <motion.button 
                    className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Report Item
                  </motion.button>
                </Link>
                <NotificationBell />
                <div className="relative group">
                  <Link to="/profile">
                    <motion.div 
                      className="flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shadow-lg">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-blue-600 font-medium">
                            {profile?.full_name?.[0] || user.email?.[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      {profile?.full_name && (
                        <span className="text-sm font-medium hidden md:block">{profile.full_name}</span>
                      )}
                    </motion.div>
                  </Link>
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile Settings
                    </Link>
                    <button onClick={signOut} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Sign Out
                    </button>
                  </motion.div>
                </div>
              </>
            ) : (
              <Link to="/auth">
                <motion.button 
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
