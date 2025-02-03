import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const subscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new;
            setNotifications((prev) => [newNotification, ...prev]);
            new Audio("/notification.mp3").play().catch(() => {});
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data: notificationsData, error: notificationsError } =
        await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

      if (notificationsError) throw notificationsError;

      const notificationsWithProfiles = await Promise.all(
        (notificationsData || []).map(async (notification) => {
          if (notification.actor_id) {
            const { data: actorProfile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("id", notification.actor_id)
              .single();

            return {
              ...notification,
              actor_profile: actorProfile || undefined,
            };
          }
          return notification;
        })
      );

      setNotifications(notificationsWithProfiles);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No notifications yet
              </p>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={`/items/${notification.item_id}`}
                  className={`block px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    markAsRead(notification.id);
                    setShowDropdown(false);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 overflow-hidden">
                      {notification.actor_profile?.avatar_url ? (
                        <img
                          src={notification.actor_profile.avatar_url}
                          alt={notification.actor_profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {notification.actor_profile?.full_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">
                          {notification.actor_profile?.full_name || "Someone"}
                        </span>{" "}
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
