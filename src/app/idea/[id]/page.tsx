"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Eye, Trash2, Pencil, MessageCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ParticleButton from "@/components/kokonutui/particle-button";
import { notifyRequestSent } from "@/components/requests/notification-toast";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TreeProvider,
  TreeView,
  TreeNode,
  TreeNodeTrigger,
  TreeNodeContent,
  TreeExpander,
  TreeIcon,
  TreeLabel,
} from "@/components/ui/kibo-ui/tree";
import { Lightbulb, Plus } from "lucide-react";

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
  isAuthor?: boolean;
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

type ContributionRequest = {
  _id: Id<"contributionRequests">;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  contributor: { name: string; username: string; } | null;
};

type TreeNode = {
  _id: string;
  title: string;
  description: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
  authorId: string;
  isDeleted?: boolean;
  author?: { _id: string; name?: string; username?: string; };
  children?: TreeNode[];
  childrenCount: number;
};

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { id } = resolvedParams;

  const ideaQuery = useQuery(api.ideas.getIdeaById, { ideaId: id as Id<"ideas"> });
  const ideaTreeQuery = useQuery(api.ideas.getIdeaTree, { rootIdeaId: id as Id<"ideas"> });
  const addSubIdeaMutation = useMutation(api.ideas.addSubIdea);
  const userRequestsQuery = useQuery(api.contributionRequests.getMyRequests);

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
            <HierarchicalIdeasSection
              idea={ideaQuery as ConvexIdea}
              ideaTree={ideaTreeQuery}
              userRequests={userRequestsQuery || []}
              addSubIdeaMutation={addSubIdeaMutation}
            />
            <ContributionRequestSection idea={ideaQuery as ConvexIdea} />
            <CommentsSection ideaId={ideaQuery._id as Id<"ideas">} commentCount={(ideaQuery as ConvexIdea).commentCount} />
          </>
        )}
      </main>

      <FooterSection />
    </div>
  );
}

const ContributionRequestSection: React.FC<{ idea: ConvexIdea }> = ({ idea }) => {
  const { userId } = useAuth();
  const createRequestMutation = useMutation(api.contributionRequests.createContributionRequest);
  const incomingRequests = useQuery(api.contributionRequests.getRequestsByIdea, { ideaId: idea._id as Id<"ideas"> });

  // Use the backend-calculated isAuthor field instead of comparing IDs directly
  const isAuthor = idea.isAuthor || false;

  // For authors: Show incoming requests
  if (isAuthor) {
    console.log("[FIXED] Author view rendered - isAuthor:", isAuthor);
    console.log("[FIXED] Author view - request count:", incomingRequests?.length || 0);
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="bg-card border border-border rounded-xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Incoming Contribution Requests</h3>
            <Link href={`/profile/contribution-requests/${idea._id}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                View All
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          </div>
          {incomingRequests === undefined ? (
            <div className="text-center py-4">
              <Spinner size={24} />
              <p className="text-muted-foreground mt-2">Loading requests...</p>
            </div>
          ) : incomingRequests && incomingRequests.length > 0 ? (
            <>
              {console.log("[SUCCESS] Found incoming requests:", incomingRequests.length)}
              <div className="space-y-4">
                {incomingRequests.map((request) => (
                  <IncomingRequestCard key={request._id} request={request} />
                ))}
              </div>
            </>
          ) : (
            <>
              {console.log('[SUCCESS] No contribution requests found - section should display "No contribution requests received yet."')}
              <p className="text-muted-foreground py-4">
                No contribution requests received yet.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }


  // For contributors: Show request interface only if logged in
  if (!userId) return null;

  return <ContributorRequestSection idea={idea} createRequestMutation={createRequestMutation} />;
};

// New component for incoming requests (author view)
const IncomingRequestCard: React.FC<{ request: ContributionRequest }> = ({ request }) => {
  const updateStatusMutation = useMutation(api.contributionRequests.updateRequestStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setIsUpdating(true);
      await updateStatusMutation({ requestId: request._id, status });
    } catch (error) {
      console.error("Failed to update request status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback>
              {request.contributor?.name?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{request.contributor?.name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">@{request.contributor?.username || "unknown"}</p>
          </div>
        </div>
        <Badge variant={request.status === "accepted" ? "default" : request.status === "rejected" ? "destructive" : "secondary"}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </div>
      <p className="text-sm mt-2">{request.message}</p>
      {request.status === "pending" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => handleStatusUpdate("accepted")}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdating ? <Spinner size={14} /> : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusUpdate("rejected")}
            disabled={isUpdating}
          >
            {isUpdating ? <Spinner size={14} /> : "Reject"}
          </Button>
        </div>
      )}
    </div>
  );
};

// New component for contributor request sending
const ContributorRequestSection: React.FC<{
  idea: ConvexIdea;
  createRequestMutation: (args: { ideaId: Id<"ideas">; message: string }) => Promise<{ requestId: string; message: string }>;
}> = ({ idea, createRequestMutation }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [existingRequest, setExistingRequest] = React.useState<Doc<"contributionRequests"> | null>(null);

  // Check if user already has a request
  const userRequests = useQuery(api.contributionRequests.getMyRequests);
  React.useEffect(() => {
    if (userRequests) {
      const request = userRequests.find(req => req.ideaId === idea._id);
      setExistingRequest(request || null);
    }
  }, [userRequests, idea._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await createRequestMutation({
        ideaId: idea._id as Id<"ideas">,
        message: message.trim(),
      });

      // Close modal and clear message
      setIsDialogOpen(false);
      setMessage("");
      // Note: Query will automatically update
      notifyRequestSent();
    } catch (err: unknown) {
      console.error("Failed to send contribution request:", err);
      setError(err instanceof Error ? err.message : "Failed to send contribution request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = () => {
    if (!existingRequest) return null;

    const status = existingRequest.status;
    const badgeColor = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      accepted: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    }[status as "pending" | "accepted" | "rejected"] || "bg-gray-100 text-gray-800 border-gray-300";

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={`border ${badgeColor}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        <div className="border border-border rounded-lg p-4 bg-muted/50">
          <p className="text-sm font-medium mb-2">Your message:</p>
          <p className="text-sm text-muted-foreground">{existingRequest.message}</p>
        </div>
        {status === "rejected" && (
          <p className="text-sm text-muted-foreground mt-2">
            You can submit a new request if you'd like to try again.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="bg-card border border-border rounded-xl p-6 transition-colors">
        <h3 className="text-lg font-semibold mb-4">
          {existingRequest ? "Your Contribution Request" : "Interested in contributing?"}
        </h3>

        {existingRequest ? (
          <div>
            {getStatusDisplay()}
            {existingRequest.status === "rejected" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Submit New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Request to Contribute</DialogTitle>
                    <DialogDescription>
                      Let {idea.author?.name || 'the author'} know how you'd like to help with this idea.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Describe your contribution
                        </label>
                        <Textarea
                          id="message"
                          placeholder="Tell us how you can contribute to this idea..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="resize-none"
                          rows={4}
                          maxLength={1200}
                          autoFocus
                          required
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{error}</span>
                          <span>{message.length}/1200</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={!message.trim() || isSubmitting || message.length > 1200}
                      >
                        {isSubmitting ? <Spinner size={16} /> : "Send Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <MessageCircle className="w-4 h-4 mr-2" />
                Request to Contribute
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request to Contribute</DialogTitle>
                <DialogDescription>
                  Let {idea.author?.name || 'the author'} know how you'd like to help with this idea.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Describe your contribution
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how you can contribute to this idea..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="resize-none"
                      rows={4}
                      maxLength={1200}
                      autoFocus
                      required
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{error}</span>
                      <span>{message.length}/1200</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={!message.trim() || isSubmitting || message.length > 1200}
                  >
                    {isSubmitting ? <Spinner size={16} /> : "Send Request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

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
                  maxLength={1200}
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
                maxLength={1200}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <div className="flex justify-between items-center">
                <Button type="submit" disabled={!content.trim() || isSubmitting} className="px-6 transition-colors">
                  {isSubmitting ? <Spinner size={18} /> : "Post Comment"}
                </Button>
                <span className="text-xs text-muted-foreground">{content.length}/1200</span>
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
    const router = useRouter();
    const toggleSparkMutation = useMutation(api.ideas.toggleSpark);
    const updateIdeaMutation = useMutation(api.ideas.updateIdea);
    const deleteIdeaMutation = useMutation(api.ideas.deleteIdea);
    const [isSparking, setIsSparking] = useState(false);
    const [currentSparkCount, setCurrentSparkCount] = useState(idea.sparkCount);
    const [currentHasSparked, setCurrentHasSparked] = useState(idea.hasSparked || false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(idea.title);
    const [editedDescription, setEditedDescription] = useState(idea.description);
    const [editedCategory, setEditedCategory] = useState(idea.category);
    const [editedVisibility, setEditedVisibility] = useState(idea.visibility);
    const [updating, setUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Available categories
   const categories = [
     { value: 'technology', label: 'Technology' },
     { value: 'art', label: 'Art' },
     { value: 'business', label: 'Business' },
     { value: 'education', label: 'Education' },
     { value: 'health', label: 'Health' },
     { value: 'entertainment', label: 'Entertainment' },
     { value: 'other', label: 'Other' }
   ];


  const handleEdit = () => {
    setEditedTitle(idea.title);
    setEditedDescription(idea.description);
    setEditedCategory(idea.category);
    setEditedVisibility(idea.visibility);
    setIsEditing(true);
    setErrorMsg("");
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedDescription.trim()) return;
    setUpdating(true);
    setErrorMsg("");
    try {
      await updateIdeaMutation({
        ideaId: idea._id as Id<"ideas">,
        title: editedTitle.trim(),
        description: editedDescription.trim(),
        category: editedCategory,
        visibility: editedVisibility
      });
      setIsEditing(false);
    } catch (err) {
      setErrorMsg("Failed to update idea. Please try again.");
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this idea? This action cannot be undone.")) return;
    setIsDeleting(true);
    setErrorMsg("");
    try {
      await deleteIdeaMutation({ ideaId: idea._id as Id<"ideas"> });
      // Redirect after successful deletion
      router.push('/feed');
    } catch (err) {
      setErrorMsg("Failed to delete idea. Please try again.");
      console.error(err);
    } finally {
      setIsDeleting(false);
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
            {(idea.isAuthor || false) && !isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="ml-2"
                  title="Edit idea"
                  disabled={isDeleting}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="ml-2"
                  title="Delete idea"
                  disabled={isDeleting || updating}
                >
                  {isDeleting ? <Spinner size={16} /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Category Badge */}
        <div className="mb-4">
          {isEditing ? (
            <div className="space-y-4">
              <Select value={editedCategory} onValueChange={setEditedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={editedVisibility === 'public'}
                      onChange={() => setEditedVisibility('public')}
                      className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                    />
                    <div>
                      <div className="font-medium text-sm">Public</div>
                      <div className="text-xs text-muted-foreground">Visible to all users</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={editedVisibility === 'private'}
                      onChange={() => setEditedVisibility('private')}
                      className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                    />
                    <div>
                      <div className="font-medium text-sm">Private</div>
                      <div className="text-xs text-muted-foreground">Visible only to your connections</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <span className="inline-block bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 text-primary font-medium px-3 py-1 rounded-full text-sm">
              {idea.category || 'General'}
            </span>
          )}
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
            maxLength={1200}
            placeholder="Idea description"
          />
        ) : (
          <p className="text-muted-foreground leading-relaxed">{idea.description}</p>
        )}
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

const HierarchicalIdeasSection: React.FC<{
  idea: ConvexIdea;
  ideaTree: TreeNode | null;
  userRequests: Doc<"contributionRequests">[];
  addSubIdeaMutation: (args: {
    parentId: Id<"ideas">;
    title: string;
    description: string;
    category: string;
    visibility: string;
  }) => Promise<{
    ideaId: string;
    message: string;
    parentId: string;
    authorId: string;
  }>;
}> = ({ idea, ideaTree, userRequests, addSubIdeaMutation }) => {
  const router = useRouter();
 const { userId } = useAuth();
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [subIdeaTitle, setSubIdeaTitle] = useState("");
 const [subIdeaDescription, setSubIdeaDescription] = useState("");
 const [subIdeaCategory, setSubIdeaCategory] = useState("other");
 const [subIdeaVisibility, setSubIdeaVisibility] = useState("public");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState("");

 // Categories
 const categories = [
   { value: 'technology', label: 'Technology' },
   { value: 'art', label: 'Art' },
   { value: 'business', label: 'Business' },
   { value: 'education', label: 'Education' },
   { value: 'health', label: 'Health' },
   { value: 'entertainment', label: 'Entertainment' },
   { value: 'other', label: 'Other' }
 ];

 // Check if user is accepted contributor or author
 const isAuthor = idea.isAuthor || false;
 const acceptedRequests = userRequests?.filter(req =>
   req.status === "accepted" && req.ideaId === idea._id
 ) || [];
 const isAcceptedContributor = acceptedRequests.length > 0;
 const canAddSubIdea = userId && (isAuthor || isAcceptedContributor);

 const handleSubmitSubIdea = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!subIdeaTitle.trim() || !subIdeaDescription.trim() || isSubmitting) return;

   setIsSubmitting(true);
   setError("");

   try {
     await addSubIdeaMutation({
       parentId: idea._id as Id<"ideas">,
       title: subIdeaTitle.trim(),
       description: subIdeaDescription.trim(),
       category: subIdeaCategory,
       visibility: subIdeaVisibility,
     });

     // Reset form and close modal
     setSubIdeaTitle("");
     setSubIdeaDescription("");
     setSubIdeaCategory("other");
     setSubIdeaVisibility("public");
     setIsModalOpen(false);
   } catch (err: unknown) {
     setError(err instanceof Error ? err.message : "Failed to create sub-idea");
   } finally {
     setIsSubmitting(false);
   }
 };

 const renderIdeaTree = (treeNode: TreeNode, level = 0, parentPath: boolean[] = [], isLast = false): React.ReactNode => {
   if (!treeNode) return null;

   const currentPath = level === 0 ? [] : [...parentPath];
   if (level > 0) {
     for (let i = 0; i < level; i++) {
       if (currentPath.length <= i) currentPath.push(false);
     }
     currentPath[level - 1] = isLast;
   }

   return (
     <TreeNode
       key={treeNode._id}
       nodeId={treeNode._id}
       level={level}
       isLast={isLast}
       parentPath={currentPath}
     >
       <TreeNodeTrigger
         className="flex items-center justify-between"
         aria-label={`Idea: ${treeNode.title} by ${treeNode.author?.name || treeNode.author?.username}`}
         onClick={() => router.push(`/idea/${treeNode._id}`)}
       >
         <div className="flex items-center space-x-3">
           <TreeExpander hasChildren={treeNode.children && treeNode.children.length > 0} />
           <TreeIcon hasChildren={treeNode.children && treeNode.children.length > 0} icon={<Lightbulb className="w-4 h-4" />} />
           <div className="flex-1">
             <TreeLabel className="font-medium">{treeNode.title}</TreeLabel>
             <div className="text-xs text-muted-foreground mt-1">
               {treeNode.category || 'General'} • by {treeNode.author?.name || treeNode.author?.username}
               {treeNode.childrenCount > 0 && ` • ${treeNode.childrenCount} sub-idea${treeNode.childrenCount !== 1 ? 's' : ''}`}
             </div>
           </div>
         </div>
       </TreeNodeTrigger>

       <TreeNodeContent hasChildren={treeNode.children && treeNode.children.length > 0}>
         <div className="border-l border-border ml-4 pl-4 py-4">
           <div className="bg-card/50 rounded-lg p-4 space-y-3">
             <p className="text-sm text-muted-foreground leading-relaxed">
               {treeNode.description.length > 200
                 ? `${treeNode.description.substring(0, 200)}...`
                 : treeNode.description
               }
             </p>
             <div className="flex items-center justify-between text-xs text-muted-foreground">
               <span>{new Date(treeNode.createdAt).toLocaleDateString()}</span>
               {treeNode.children && treeNode.children.length > 0 && (
                 <span>{treeNode.childrenCount} sub-ideas</span>
               )}
             </div>
           </div>
         </div>
         {treeNode.children && treeNode.children.length > 0 &&
           treeNode.children.map((child: TreeNode, index: number) =>
             renderIdeaTree(
               child,
               level + 1,
               currentPath,
               index === treeNode.children!.length - 1
             )
           )
         }
       </TreeNodeContent>
     </TreeNode>
   );
 };

 return (
   <div className="max-w-4xl mx-auto mt-8">
     <div className="bg-card border border-border rounded-xl p-6 transition-colors">
       <div className="flex items-center justify-between mb-4">
         <h3 className="text-lg font-semibold">Idea Hierarchy</h3>
         {canAddSubIdea && (
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
             <DialogTrigger asChild>
               <Button className="flex items-center gap-2" aria-label="Add sub-idea">
                 <Plus className="w-4 h-4" />
                 Add Sub-Idea
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[500px]" aria-describedby="sub-idea-description">
               <DialogHeader>
                 <DialogTitle>Create Sub-Idea</DialogTitle>
                 <DialogDescription id="sub-idea-description">
                   Add a new idea that expands on this concept. Your sub-idea will be publicly visible under the parent idea.
                 </DialogDescription>
               </DialogHeader>

               <form onSubmit={handleSubmitSubIdea} className="space-y-4">
                 <div className="space-y-4">
                   <div>
                     <label htmlFor="sub-title" className="text-sm font-medium">
                       Title *
                     </label>
                     <Input
                       id="sub-title"
                       placeholder="Enter sub-idea title..."
                       value={subIdeaTitle}
                       onChange={(e) => setSubIdeaTitle(e.target.value)}
                       className="mt-1"
                       maxLength={100}
                       autoFocus
                       required
                     />
                   </div>

                   <div>
                     <label htmlFor="sub-description" className="text-sm font-medium">
                       Description *
                     </label>
                     <Textarea
                       id="sub-description"
                       placeholder="Describe your sub-idea..."
                       value={subIdeaDescription}
                       onChange={(e) => setSubIdeaDescription(e.target.value)}
                       className="mt-1 resize-none"
                       rows={4}
                       maxLength={1200}
                       required
                     />
                   </div>

                   <div>
                     <label htmlFor="sub-category" className="text-sm font-medium">
                       Category
                     </label>
                     <Select value={subIdeaCategory} onValueChange={setSubIdeaCategory}>
                       <SelectTrigger id="sub-category" className="mt-1">
                         <SelectValue placeholder="Select category" />
                       </SelectTrigger>
                       <SelectContent>
                         {categories.map((cat) => (
                           <SelectItem key={cat.value} value={cat.value}>
                             {cat.label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-3">
                     <label className="text-sm font-medium">Visibility</label>
                     <div className="space-y-2">
                       <label className="flex items-center space-x-3">
                         <input
                           type="radio"
                           name="sub-visibility"
                           value="public"
                           checked={subIdeaVisibility === 'public'}
                           onChange={() => setSubIdeaVisibility('public')}
                           className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                           required
                         />
                         <div>
                           <div className="font-medium text-sm">Public</div>
                           <div className="text-xs text-muted-foreground">Visible to all users</div>
                         </div>
                       </label>
                       <label className="flex items-center space-x-3">
                         <input
                           type="radio"
                           name="sub-visibility"
                           value="private"
                           checked={subIdeaVisibility === 'private'}
                           onChange={() => setSubIdeaVisibility('private')}
                           className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                         />
                         <div>
                           <div className="font-medium text-sm">Private</div>
                           <div className="text-xs text-muted-foreground">Visible only to your connections</div>
                         </div>
                       </label>
                     </div>
                   </div>
                 </div>

                 {error && (
                   <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                     {error}
                   </div>
                 )}

                 <DialogFooter>
                   <DialogClose asChild>
                     <Button
                       type="button"
                       variant="outline"
                       disabled={isSubmitting}
                       onClick={() => setIsModalOpen(false)}
                     >
                       Cancel
                     </Button>
                   </DialogClose>
                   <Button
                     type="submit"
                     disabled={!subIdeaTitle.trim() || !subIdeaDescription.trim() || isSubmitting}
                   >
                     {isSubmitting ? <Spinner size={16} /> : "Create Sub-Idea"}
                   </Button>
                 </DialogFooter>
               </form>
             </DialogContent>
           </Dialog>
         )}
       </div>

       {ideaTree === undefined ? (
         <div className="flex items-center justify-center py-8">
           <Spinner size={32} />
           <p className="ml-3 text-muted-foreground">Loading hierarchy...</p>
         </div>
       ) : ideaTree === null ? (
         <div className="text-center py-8">
           <p className="text-muted-foreground">No hierarchy data available.</p>
         </div>
       ) : (
         <TreeProvider
           showLines={true}
           showIcons={true}
           selectable={false}
           multiSelect={false}
           animateExpand={true}
           className="idea-hierarchy-tree"
         >
           <TreeView aria-label="Idea hierarchy tree">
             {renderIdeaTree(ideaTree)}
           </TreeView>
         </TreeProvider>
       )}

       {!canAddSubIdea && userId && (
         <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
           <div className="flex items-center space-x-2">
             <Lightbulb className="w-4 h-4 text-muted-foreground" />
             <p className="text-sm text-muted-foreground">
               Only the idea creator or accepted contributors can add sub-ideas.
             </p>
           </div>
         </div>
       )}
     </div>
   </div>
 );
};
