import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, UserMinus, UserPlus, Settings, Trash2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChannelSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: Id<"conversations">;
    ideaId: Id<"ideas">;
    onChannelDeleted?: () => void;
}

export const ChannelSettingsDialog: React.FC<ChannelSettingsDialogProps> = ({
    isOpen,
    onClose,
    conversationId,
    ideaId,
    onChannelDeleted
}) => {
    const { isAuthenticated } = useConvexAuth();
    const { toast } = useToast();
    const currentUserDoc = useQuery(api.chat.getUserByClerkId, isAuthenticated ? {} : "skip");

    // Check if the current user is the creator
    const conversations = useQuery(api.chat.getGroupConversationsList, isAuthenticated ? {} : "skip");
    const currentChannel = conversations?.find(c => c.conversationId === conversationId);

    // We didn't expose creatorId in getGroupConversationsList easily, but members query helps.
    // Actually, getGroupMembers returns { role: 'admin' | 'member' }. Admin is the creator.
    const members = useQuery(api.chat.getGroupMembers, isOpen ? { conversationId } : "skip");
    const potentialMembers = useQuery(api.chat.getPotentialGroupMembers, isOpen ? { ideaId } : "skip");

    const removeMember = useMutation(api.chat.removeGroupMember);
    const addMember = useMutation(api.chat.addGroupMember);
    const deleteGroup = useMutation(api.chat.deleteGroupConversation);

    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");

    const currentUserId = currentUserDoc?._id;
    const currentUserMembership = members?.find(m => m.id === currentUserId);
    const isAdmin = currentUserMembership?.role === "admin";

    // Filter potential members to only show those not already in the group
    const availableToAdd = potentialMembers?.filter(
        pm => !members?.some(m => m.id === pm.id)
    ) || [];

    const handleRemoveMember = async (userId: Id<"users">) => {
        setIsProcessing(true);
        try {
            await removeMember({ conversationId, userId });
            toast({ description: "User removed from channel" });
            if (userId === currentUserId) {
                // Self-kick / leave
                onChannelDeleted?.();
                onClose();
            }
        } catch (error: any) {
            toast({ description: error.message || "Failed to remove user", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserToAdd) return;
        setIsProcessing(true);
        try {
            await addMember({ conversationId, userId: selectedUserToAdd as Id<"users"> });
            toast({ description: "User added to channel" });
            setSelectedUserToAdd("");
        } catch (error: any) {
            toast({ description: error.message || "Failed to add user", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteChannel = async () => {
        if (!window.confirm("Are you sure you want to delete this channel? All messages will be lost forever.")) return;
        setIsProcessing(true);
        try {
            await deleteGroup({ conversationId });
            toast({ description: "Channel deleted" });
            onChannelDeleted?.();
            onClose();
        } catch (error: any) {
            toast({ description: error.message || "Failed to delete channel", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-primary" />
                        Channel Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage channel members and settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
                    {/* Add Member Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground border-b pb-2">Add Members</h4>
                        <div className="flex gap-2 items-center">
                            <Select value={selectedUserToAdd} onValueChange={setSelectedUserToAdd} disabled={isProcessing || availableToAdd.length === 0}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={availableToAdd.length > 0 ? "Select a contributor..." : "No available contributors"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableToAdd.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-5 h-5">
                                                    <AvatarImage src={user.avatar || undefined} />
                                                    <AvatarFallback>{user.displayName?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                {user.displayName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleAddMember} disabled={!selectedUserToAdd || isProcessing}>
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 flex-shrink-0" />}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Only contributors of this Idea can be added to sub-channels.</p>
                    </div>

                    {/* Members List */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground border-b pb-2">Current Members ({members?.length || 0})</h4>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2 pr-4">
                                {members === undefined ? (
                                    <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                                ) : members.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No members found.</p>
                                ) : (
                                    members.map((member) => (
                                        <div key={member.id} className="flex flex-row items-center justify-between p-2 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Avatar className="w-8 h-8 flex-shrink-0">
                                                    <AvatarImage src={member.avatar || undefined} />
                                                    <AvatarFallback>{member.displayName?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-medium truncate">{member.displayName} {member.id === currentUserId && "(You)"}</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize">{member.role}</span>
                                                </div>
                                            </div>
                                            {/* Allow Admin to remove others, OR user to remove themselves if not admin */}
                                            {(isAdmin && member.id !== currentUserId) ? (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleRemoveMember(member.id)} disabled={isProcessing}>
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            ) : (member.id === currentUserId && !isAdmin) ? (
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleRemoveMember(member.id)} title="Leave channel" disabled={isProcessing}>
                                                    <LogOut className="w-4 h-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Danger Zone */}
                    {isAdmin && (
                        <div className="space-y-3 pt-4">
                            <h4 className="text-sm font-semibold text-destructive border-b border-destructive/20 pb-2">Danger Zone</h4>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-destructive">Delete Channel</span>
                                    <span className="text-[10px] text-destructive/80">This action cannot be undone.</span>
                                </div>
                                <Button size="sm" variant="destructive" onClick={handleDeleteChannel} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
