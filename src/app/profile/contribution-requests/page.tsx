"use client"

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";

export const dynamic = 'force-dynamic';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Inbox,
  Send,
} from "lucide-react";

interface IncomingRequest {
  _id: Id<"contributionRequests">;
  message: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  idea: { title: string; description: string; _id: Id<"ideas"> } | null;
  contributor: { avatar?: string; displayName: string; username: string } | null;
}

interface MyRequest {
  _id: Id<"contributionRequests">;
  message: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  idea: { title: string; description: string; _id: Id<"ideas"> } | null;
  author?: { avatar?: string; displayName: string; username: string } | null;
}

type Tab = "incoming" | "outgoing";

export default function ContributionRequestsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("incoming");

  const updateRequestStatus = useMutation(api.contributionRequests.updateRequestStatus);
  const incomingRequests = useQuery(api.contributionRequests.getIncomingRequests);
  const myRequests = useQuery(api.contributionRequests.getMyRequests);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<Id<"contributionRequests"> | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isLoaded) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const handleAccept = async (requestId: Id<"contributionRequests">) => {
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "accepted" });
      toast({ title: "Request accepted", description: "The contributor has been notified." });
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: Id<"contributionRequests">) => {
    setCurrentRequestId(requestId);
    if (!rejectDialogOpen) {
      setRejectDialogOpen(true);
      return;
    }
    setLoadingAction(requestId);
    try {
      await updateRequestStatus({ requestId, status: "rejected" });
      setRejectDialogOpen(false);
      setRejectionMessage("");
      setCurrentRequestId(null);
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectConfirm = () => {
    if (currentRequestId) handleReject(currentRequestId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const incomingCount = incomingRequests?.length ?? 0;
  const outgoingCount = myRequests?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contribution Requests</h1>
            <p className="text-muted-foreground">
              Manage requests on your ideas and track the ones you've sent.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "incoming"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Inbox className="w-4 h-4" />
            Incoming
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] tabular-nums",
              activeTab === "incoming" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {incomingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "outgoing"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Send className="w-4 h-4" />
            My Requests
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] tabular-nums",
              activeTab === "outgoing" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {outgoingCount}
            </span>
          </button>
        </div>

        {/* INCOMING tab */}
        {activeTab === "incoming" && (
          <>
            {incomingRequests === undefined ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : incomingRequests.length > 0 ? (
              <div className="space-y-4">
                {incomingRequests.map((request: IncomingRequest) => (
                  <Card key={request._id} className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {request.contributor && (
                            <>
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={request.contributor.avatar}
                                  alt={request.contributor.displayName}
                                />
                                <AvatarFallback>
                                  {request.contributor.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Link
                                  href={`/profile/${request.contributor.username}`}
                                  className="font-medium hover:text-primary transition-colors"
                                >
                                  {request.contributor.displayName}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                  @{request.contributor.username}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {request.idea && (
                          <Link
                            href={`/idea/${request.idea._id}`}
                            className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <p className="text-sm font-medium">Request for:</p>
                            <p className="text-sm font-semibold text-primary">
                              {request.idea.title}
                            </p>
                            {request.idea.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.idea.description.length > 100
                                  ? `${request.idea.description.substring(0, 100)}...`
                                  : request.idea.description}
                              </p>
                            )}
                          </Link>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-1">Message:</p>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                            {request.message}
                          </p>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex gap-2 pt-3 border-t">
                            <Button
                              onClick={() => handleAccept(request._id)}
                              disabled={loadingAction === request._id}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                            >
                              {loadingAction === request._id ? <Spinner size={16} /> : <CheckCircle className="w-4 h-4" />}
                              {loadingAction === request._id ? "Accepting..." : "Accept"}
                            </Button>
                            <Button
                              onClick={() => handleReject(request._id)}
                              disabled={loadingAction === request._id}
                              className="flex-1 flex items-center gap-2"
                              variant="destructive"
                            >
                              {loadingAction === request._id ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
                              {loadingAction === request._id ? "Rejecting..." : "Reject"}
                            </Button>
                          </div>
                        )}

                        {request.status !== "pending" && (
                          <div className="flex items-center justify-center gap-2 pt-3 border-t">
                            <CheckCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Request {request.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                  No incoming requests yet
                </h2>
                <p className="text-muted-foreground">
                  When contributors ask to help on your ideas, they'll show up here.
                </p>
              </div>
            )}
          </>
        )}

        {/* OUTGOING tab */}
        {activeTab === "outgoing" && (
          <>
            {myRequests === undefined ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : myRequests.length > 0 ? (
              <div className="space-y-4">
                {myRequests.map((request: MyRequest) => (
                  <Card key={request._id} className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {request.author ? (
                            <>
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={request.author.avatar} alt={request.author.displayName} />
                                <AvatarFallback>
                                  {request.author.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <Link
                                  href={`/profile/${request.author.username}`}
                                  className="font-medium hover:text-primary transition-colors truncate block"
                                >
                                  {request.author.displayName}
                                </Link>
                                <p className="text-sm text-muted-foreground truncate">
                                  @{request.author.username}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">Idea owner</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {getStatusBadge(request.status)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {request.idea && (
                          <Link
                            href={`/idea/${request.idea._id}`}
                            className="block p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <p className="text-sm font-medium">Request to join:</p>
                            <p className="text-sm font-semibold text-primary">
                              {request.idea.title}
                            </p>
                            {request.idea.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {request.idea.description.length > 100
                                  ? `${request.idea.description.substring(0, 100)}...`
                                  : request.idea.description}
                              </p>
                            )}
                          </Link>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-1">Your message:</p>
                          <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                            {request.message}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-3 border-t">
                          {request.status === "pending" && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Waiting for the idea owner to respond
                            </span>
                          )}
                          {request.status === "accepted" && (
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accepted — you're a collaborator
                            </span>
                          )}
                          {request.status === "rejected" && (
                            <span className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5" />
                              Declined
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                  You haven't sent any requests
                </h2>
                <p className="text-muted-foreground">
                  Find an idea you want to help with and click <span className="font-medium">Collaborate</span> to send a request.
                </p>
              </div>
            )}
          </>
        )}

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Contribution Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject this contribution request? You can provide an optional reason below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Optional reason for rejection..."
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={loadingAction !== null}
                className="flex items-center gap-2"
              >
                {loadingAction ? <Spinner size={16} /> : <XCircle className="w-4 h-4" />}
                {loadingAction ? "Rejecting..." : "Reject Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}