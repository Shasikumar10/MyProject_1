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
import { Item, Comment, Profile, ItemClaim } from '../types';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [itemOwner, setItemOwner] = useState(null);
  const [claim, setClaim] = useState(null);
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

  async function handleStatusChange(newStatus) {
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setItem((item) => (item ? { ...item, status: newStatus } : null));
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function handleCommentSubmit(e) {
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

  async function handleClaimSubmit(proofFile) {
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

  async function handleClaimAction(status, claimId) {
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

        setItem((prev) => (prev ? { ...prev, status: 'resolved' } : null));
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
                <Button variant="outline" size="sm" onClick={() => navigate(`/items/${id}/edit`)} >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDelete} >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                <MapPin className="inline-block w-4 h-4 mr-2" />
                {item.location}
              </p>
              <p className="text-sm text-gray-500">
                <Calendar className="inline-block w-4 h-4 mr-2" />
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                <Tag className="inline-block w-4 h-4 mr-2" />
                {item.category}
              </p>
            </div>
          </div>

          <p className="text-gray-700">{item.description}</p>
        </Card.Content>
      </Card>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold">Comments</h2>

        <div className="space-y-4 mt-4">
          {comments.length === 0 ? (
            <p className="text-gray-500">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex space-x-4">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-center flex items-center justify-center">
                  {comment.profiles?.avatar_url ? (
                    <img
                      src={comment.profiles.avatar_url}
                      alt={comment.profiles.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    comment.profiles?.full_name[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold">{comment.profiles?.full_name}</p>
                  <p>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleCommentSubmit} className="mt-6">
          <textarea
            rows="4"
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <Button
            type="submit"
            className="mt-2"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </form>
      </div>

      {claim ? (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold">Claim Status</h2>
          <div className="space-x-4 mt-4">
            <Badge variant={claim.status === 'pending' ? 'warning' : claim.status === 'approved' ? 'success' : 'error'}>
              {claim.status}
            </Badge>
            {claim.status === 'pending' && user?.id === item.user_id && (
              <div className="mt-2 space-x-2">
                <Button onClick={() => handleClaimAction('approved', claim.id)}>Approve</Button>
                <Button onClick={() => handleClaimAction('rejected', claim.id)}>Reject</Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        user?.id !== item.user_id && (
          <div className="mt-6">
            <h2 className="text-2xl font-semibold">Claim Item</h2>
            <Button
              className="mt-4"
              onClick={() => handleClaimSubmit(fileInput.current.files[0])}
              disabled={uploadingProof}
            >
              {uploadingProof ? 'Uploading...' : 'Submit Proof of Ownership'}
            </Button>
          </div>
        )
      )}
    </div>
  );
}
