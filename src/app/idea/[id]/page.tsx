"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Eye, Trash2, Pencil } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import ParticleButton from "@/components/kokonutui/particle-button";

type ConvexIdea = {
  _id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  sparkCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  author?: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
  hasSparked?: boolean;
};

type Comment = {
  _id: string;
  authorId: string;
  content: string;
  createdAt: number;
  parentCommentId?: string;
  author: {
    _id: string;
    name?: string;
    username?: string;
    avatar?: string;
  } | null;
};

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;

  const ideaQuery = useQuery(api.ideas.getIdeaById, { ideaId: id as Id<"ideas"> });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Spinner size={40} />
        </main>
        <FooterSection />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <Spinner size={40} />
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      {/* Back Button */}
      <div className="border-b border-border pt-16 pb-4 rounded-b-xl">
        <div className="container mx-auto px-4 rounded-xl">
          <Button
          variant="ghost"
          onClick={() => router.push('/feed')}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12">
        {ideaQuery === undefined ? (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <Spinner size={48} />
            <p className="ml-4 text-muted-foreground">Loading idea...</p>
          </div>
        ) : ideaQuery === null ? (
          // Not found state
          <div className="text-center py-12">
            <Eye className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Idea Not Found</h2>
            <p className="text-muted-foreground mb-6">The idea you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push('/feed')}>
              Back to Feed
            </Button>
          </div>
        ) : (
          <>
            <IdeaContent idea={ideaQuery as ConvexIdea} />
            <CommentsSection ideaId={ideaQuery._id as Id<"ideas">} commentCount={(ideaQuery as ConvexIdea).commentCount} />
          </>
        )}
      </main>

      <FooterSection />
    </div>
  );
}

const CommentsSection: React.FC<{ ideaId: Id<"ideas">; commentCount: number }> = ({ ideaId, commentCount }) => {
  const { userId } = useAuth();

  const groupByParent = (comments: Comment[]) => {
    const roots: Comment[] = [];
    const replies: { [key: string]: Comment[] } = {};
    comments.forEach(c => {
      if (c.parentCommentId) {
        if (!replies[c.parentCommentId]) replies[c.parentCommentId] = [];
        replies[c.parentCommentId].push(c);
      } else {
        roots.push(c);
      }
    });
    return { roots, replies };
  };

  const CommentItem: React.FC<{ comment: Comment; replies: Comment[]; ideaId: Id<"ideas">; level?: number }> = ({ comment, replies, ideaId, level = 0 }) => {
    const [showReply, setShowReply] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const addCommentMutation = useMutation(api.ideas.addComment);
    const deleteCommentMutation = useMutation(api.ideas.deleteComment);

    const handleReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim() || !userId) return;
      setIsReplying(true);
      try {
        await addCommentMutation({
          ideaId,
          content: replyContent.trim(),
          parentCommentId: comment._id as Id<"comments">,
        });
        setReplyContent("");
        setShowReply(false);
      } catch (err) {
        console.error(err);
      } finally {
        setIsReplying(false);
      }
    };

    const handleDelete = async () => {
      if (!userId || !confirm("Are you sure you want to delete this comment? This action cannot be undone and will also remove any replies to this comment.")) return;
      setIsDeleting(true);
      try {
        await deleteCommentMutation({ commentId: comment._id as Id<"comments"> });
      } catch (err) {
        console.error(err);
      } finally {
        setIsDeleting(false);
      }
    };

    const getInitials = (name: string) => {
      return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
      <div className={`border-l-2 border-border pl-4 ${level > 0 ? "ml-4" : ""} py-4 ${level === 0 ? "bg-card rounded-xl p-4 transition-colors" : "rounded-xl"}`}>
        <div className="flex items-start space-x-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.author?.avatar} alt={comment.author?.name} />
            <AvatarFallback>{getInitials(comment.author?.name || comment.author?.username || "U")}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-sm">{comment.author?.name || comment.author?.username}</span>
              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm leading-relaxed">{comment.content}</p>
            <div className="mt-2 flex items-center space-x-4 text-xs">
              {userId && <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={() => setShowReply(!showReply)}>Reply</button>}
              {userId === comment.authorId && <button className="text-destructive hover:text-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={handleDelete} disabled={isDeleting} title="Delete comment">{isDeleting ? <Spinner size={14} /> : <Trash2 className="w-4 h-4" />}</button>}
            </div>
            {showReply && (
              <form onSubmit={handleReply} className="mt-4 flex space-x-2 rounded-xl">
                <Textarea
                  placeholder="Add a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="h-20 flex-1 resize-none rounded-xl"
                  maxLength={500}
                />
                <div className="flex flex-col space-y-2">
                  <Button type="submit" disabled={!replyContent.trim() || isReplying} className="px-4 transition-colors">
                    {isReplying ? <Spinner size={16} /> : "Reply"}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowReply(false)} className="transition-colors">Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </div>
        {replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply._id} comment={reply} replies={[]} ideaId={ideaId} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const comments = useQuery(api.ideas.getComments, { ideaId, limit: 100 });
  const addCommentMutation = useMutation(api.ideas.addComment);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userId) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation({
        ideaId,
        content: content.trim(),
      });
      setContent("");
      setError("");
    } catch (err) {
      setError("Failed to post comment");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { roots, replies } = groupByParent(comments || []);

  return (
    <div className="mt-12 max-w-4xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 transition-colors">
        <h3 className="text-xl font-semibold mb-4">{commentCount} Comments</h3>
        {
          userId ? (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 rounded-xl">
              <Textarea
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-20 resize-none rounded-xl"
                disabled={isSubmitting}
                maxLength={500}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex justify-between items-center">
                <Button type="submit" disabled={!content.trim() || isSubmitting} className="px-6 transition-colors">
                  {isSubmitting ? <Spinner size={18} /> : "Post Comment"}
                </Button>
                <span className="text-xs text-muted-foreground">{content.length}/500</span>
              </div>
            </form>
          ) : (
            <p className="text-muted-foreground">Sign in to leave a comment.</p>
          )
        }
        <div className="space-y-4">
          {roots.map(comment => (
            <CommentItem key={comment._id} comment={comment} replies={replies[comment._id] || []} ideaId={ideaId} />
          ))}
          {comments === undefined && <div className="flex justify-center"><Spinner size={24} /></div>}
        </div>
      </div>
    </div>
  );
};

const IdeaContent: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
  const { userId } = useAuth();
  const toggleSparkMutation = useMutation(api.ideas.toggleSpark);
  const updateIdeaMutation = useMutation(api.ideas.updateIdea);
  const [isSparking, setIsSparking] = useState(false);
  const [currentSparkCount, setCurrentSparkCount] = useState(idea.sparkCount);
  const [currentHasSparked, setCurrentHasSparked] = useState(idea.hasSparked || false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(idea.title);
  const [editedDescription, setEditedDescription] = useState(idea.description);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEdit = () => {
    setEditedTitle(idea.title);
    setEditedDescription(idea.description);
    setIsEditing(true);
    setErrorMsg("");
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedDescription.trim()) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      await updateIdeaMutation({ ideaId: idea._id as Id<"ideas">, title: editedTitle.trim(), description: editedDescription.trim() });
      setIsEditing(false);
    } catch (err) {
      setErrorMsg("Failed to update idea. Please try again.");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg("");
  };

  const handleSpark = async () => {
    if (!userId || isSparking) return;

    setIsSparking(true);

    try {
      const result = await toggleSparkMutation({ ideaId: idea._id as Id<"ideas"> });
      setCurrentSparkCount(result.sparkCount);
      setCurrentHasSparked(result.action === 'added');
    } catch (error) {
      console.error('Error toggling spark:', error);
    } finally {
      setIsSparking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: idea.title,
        text: idea.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto rounded-xl">
      {/* Title with Gradient */}
      <div className="mb-6 rounded-xl">
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="text-4xl font-bold mb-4 border-0 bg-transparent text-transparent bg-gradient-to-r from-primary to-purple-600 bg-clip-text p-0"
            disabled={updating}
            maxLength={100}
            placeholder="Idea title"
          />
        ) : (
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
              {idea.title}
            </h1>
            {userId === idea.authorId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="ml-2"
                title="Edit idea"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="mb-4">
          <span className="inline-block bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 text-primary font-medium px-3 py-1 rounded-full text-sm">
            {idea.category || 'General'}
          </span>
        </div>

        {/* Spark Button */}
        <div className="flex items-center justify-content-start mb-6">
          <ParticleButton
            variant={currentHasSparked ? "default" : "outline"}
            size="default"
            onSuccess={handleSpark}
            disabled={!userId || isSparking}
            className={`
              transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95
              ${currentHasSparked
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl'
                : 'hover:bg-accent/5 hover:border-destructive/50 hover:text-destructive'
              }
              ${isSparking ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isSparking ? (
              <Spinner size={18} />
            ) : (
              <span className="text-sm font-medium">
                {currentHasSparked ? `Sparks ✨ ${currentSparkCount}` : 'Spark ✨'}
              </span>
            )}
          </ParticleButton>
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-lg max-w-none mb-8 p-6 bg-gradient-to-br from-card/50 to-card/30 rounded-xl border border-border transition-colors">
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="text-muted-foreground leading-relaxed border-0 bg-transparent resize-none w-full"
            disabled={updating}
            maxLength={500}
            placeholder="Idea description"
          />
        ) : (
          <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
        )}
      </div>


      {/* Author Section */}
      <div className="mb-8 p-6 bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl border border-border transition-colors">
        <h3 className="text-lg font-semibold mb-4">Created by</h3>
        <div className="flex items-center space-x-4">
          {idea.author?.avatar ? (
            <Image
              src={idea.author.avatar}
              alt={idea.author?.name || idea.author?.username || 'User'}
              className="w-12 h-12 rounded-full object-cover"
              width={48}
              height={48}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-medium">
              {getInitials(idea.author?.name || idea.author?.username || 'Unknown')}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground">{idea.author?.name || idea.author?.username || 'Unknown'}</h4>
            <p className="text-sm text-muted-foreground">@{(idea.author?.username || 'unknown').toLowerCase()}</p>
          </div>
          {idea.author?.username && (
            <Link
              href={`/profile/${idea.author.username}`}
              className="ml-auto"
            >
              <Button variant="outline" size="sm" className="transition-colors">
                View Profile
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isEditing && errorMsg && <p className="text-destructive text-sm mb-4">{errorMsg}</p>}

      {isEditing && (
        <div className="flex space-x-2 mb-8">
          <Button onClick={handleSave} disabled={!editedTitle.trim() || !editedDescription.trim() || updating}>
            {updating ? <Spinner size={18} /> : "Save"}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={updating}>
            Cancel
          </Button>
        </div>
      )}

    </div>
  ); }
