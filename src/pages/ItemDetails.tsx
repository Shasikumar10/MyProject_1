import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Calendar, Tag, MessageCircle, Edit2, Trash2, Upload, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Item, Comment, Profile, ItemClaim } from '@/types';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemOwner, setItemOwner] = useState<Profile | null>(null);
  const [claim, setClaim] = useState<ItemClaim | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  useEffect(() => {
    fetchItemDetails();
    fetchComments();
    if (user) {
      fetchClaim();
    }
  }, [id, user]);

  async function fetchItemDetails() {
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(item);

      if (item) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', item.user_id)
          .single();

        if (!userError && userData) {
          setItemOwner(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments() {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('item_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  }

  async function fetchClaim() {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('item_claims')
        .select('*')
        .eq('item_id', id)
        .eq('claimed_by', user.id)
        .maybeSingle();

      if (!error) {
        setClaim(data);
      }
    } catch (error) {
      console.error('Error fetching claim:', error);
    }
  }

  async function handleDelete() {
    if (!user || !item) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Item deleted successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  }

  async function handleStatusChange(newStatus: Item['status']) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setItem(item => item ? { ...item, status: newStatus } : null);
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert([
          {
            item_id: id,
            user_id: user.id,
            content: newComment.trim(),
          },
        ]);

      if (error) throw error;
      setNewComment('');
      fetchComments();
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClaimSubmit(proofFile: File) {
    if (!user || !id) return;

    setUploadingProof(true);
    try {
      // Upload proof image
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${id}-${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(fileName);

      // Create claim
      const { error: claimError } = await supabase
        .from('item_claims')
        .insert([
          {
            item_id: id,
            claimed_by: user.id,
            proof_of_ownership: publicUrl,
          },
        ]);

      if (claimError) throw claimError;

      toast.success('Claim submitted successfully');
      fetchClaim();
    } catch (error) {
      toast.error('Failed to submit claim');
    } finally {
      setUploadingProof(false);
    }
  }

  async function handleClaimAction(status: 'approved' | 'rejected', claimId: string) {
    try {
      const { error } = await supabase
        .from('item_claims')
        .update({ status })
        .eq('id', claimId);

      if (error) throw error;

      if (status === 'approved') {
        // Update item status to resolved
        await supabase
          .from('items')
          .update({ status: 'resolved' })
          .eq('id', id);
        
        setItem(prev => prev ? { ...prev, status: 'resolved' } : null);
      }

      fetchClaim();
      toast.success(`Claim ${status}`);
    } catch (error) {
      toast.error('Failed to update claim');
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
        <p className="mt-2 text-gray-500">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Item not found</p>
      </div>
    );
  }

  const ownerInitial = itemOwner?.full_name ? itemOwner.full_name[0].toUpperCase() : '?';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>

      <Card>
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-96 object-cover rounded-t-lg"
          />
        )}
        
        <Card.Content>
          <div className="flex items-center justify-between mb-4">
            <div className="space-x-2">
              <Badge
                variant={item.type === 'lost' ? 'error' : 'success'}
                className="uppercase"
              >
                {item.type}
              </Badge>
              <Badge
                variant={
                  item.status === 'open'
                    ? 'warning'
                    : item.status === 'resolved'
                    ? 'success'
                    : 'default'
                }
                className="capitalize"
              >
                {item.status}
              </Badge>
            </div>
            
            {user?.id === item.user_id && (
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/items/${id}/edit`)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span>{item.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-5 h-5" />
                <span>{formatDistanceToNow(new Date(item.date), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-5 h-5" />
                <span className="capitalize">{item.category}</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>

          {/* Item Owner Info */}
          {itemOwner && (
            <div className="border-t pt-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Posted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {itemOwner.avatar_url ? (
                    <img
                      src={itemOwner.avatar_url}
                      alt={itemOwner.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg text-gray-600">
                      {ownerInitial}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{itemOwner.full_name}</p>
                  <p className="text-sm text-gray-500">{itemOwner.department}</p>
                </div>
              </div>
            </div>
          )}

          {/* Claim Section */}
          {user && item.status !== 'resolved' && user.id !== item.user_id && (
            <div className="border-t pt-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Claim Item</h3>
              {claim ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium mb-2">
                    Claim Status: <span className="capitalize">{claim.status}</span>
                  </p>
                  {claim.admin_notes && (
                    <p className="text-gray-600 text-sm">{claim.admin_notes}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    If this is your item, you can claim it by providing proof of ownership.
                  </p>
                  <label className="block">
                    <Button
                      variant="outline"
                      className="relative"
                      disabled={uploadingProof}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingProof ? 'Uploading...' : 'Upload Proof of Ownership'}
                      <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleClaimSubmit(file);
                        }}
                        disabled={uploadingProof}
                      />
                    </Button>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Claim Management for Item Owner */}
          {user?.id === item.user_id && item.status !== 'resolved' && (
            <div className="border-t pt-4 mb-6">
              <h3 className="text-lg font-semibold mb-2">Manage Claims</h3>
              {claim && claim.status === 'pending' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={claim.proof_of_ownership}
                      alt="Proof of Ownership"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium mb-2">Claim Pending</p>
                      <div className="space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleClaimAction('approved', claim.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClaimAction('rejected', claim.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {user?.id === item.user_id && item.status !== 'resolved' && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Update Status</h3>
              <div className="flex gap-2">
                <Button
                  variant={item.status === 'open' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('open')}
                >
                  Open
                </Button>
                <Button
                  variant={item.status === 'in_progress' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  In Progress
                </Button>
                <Button
                  variant={item.status === 'resolved' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('resolved')}
                >
                  Resolved
                </Button>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Comments</h2>
        </Card.Header>
        
        <Card.Content>
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                className="w-full rounded-md border border-gray-200 p-3 min-h-[100px]"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
              <Button
                type="submit"
                className="mt-2"
                disabled={submitting}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          ) : (
            <p className="text-center py-4 text-gray-500">
              Please sign in to leave a comment
            </p>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {(comment.profiles as any)?.avatar_url ? (
                      <img
                        src={(comment.profiles as any).avatar_url}
                        alt={(comment.profiles as any).full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 font-medium">
                        {(comment.profiles as any)?.full_name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {(comment.profiles as any)?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 pl-10">{comment.content}</p>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}