
import React, { memo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Plus, ArrowLeft, Hash } from "lucide-react";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { formatDistanceToNow } from "date-fns";
import { useChat } from "./ChatContext";

interface ChannelListProps {
    ideaId: Id<"ideas">;
    onBack: () => void;
    onSelectChannel: (conversationId: Id<"conversations">) => void;
}

const ChannelList: React.FC<ChannelListProps> = memo(({ ideaId, onBack, onSelectChannel }) => {
    const channels = useQuery(api.communities.getChannels, { ideaId });
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const idea = useQuery(api.ideas.getIdeaById, { ideaId });

    // Filter out "General" channel if needed, or sort it to top
    // Assuming 'channels' returns all groups linked to this idea

    return (
        <div className="w-full h-full bg-background flex flex-col">
            {/* Header */}
            <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0 bg-card/50 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 -ml-1">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{idea?.title || "Community"}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">Channels</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary hover:bg-primary/10"
                    onClick={() => setShowCreateGroup(true)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            {/* Channel List */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="px-2 py-2 space-y-1">
                    {channels === undefined ? (
                        <div className="text-center text-muted-foreground py-8 text-xs">Loading channels...</div>
                    ) : channels.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 text-sm px-4">
                            <p>No channels yet.</p>
                            <Button
                                variant="link"
                                className="text-xs h-auto p-0 mt-1"
                                onClick={() => setShowCreateGroup(true)}
                            >
                                Create one?
                            </Button>
                        </div>
                    ) : (
                        channels.map((channel) => (
                            <Button
                                key={channel._id}
                                variant="ghost"
                                className="w-full flex items-center gap-2.5 p-2 h-auto justify-start hover:bg-accent/50 transition-all duration-200"
                                onClick={() => onSelectChannel(channel._id)}
                            >
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                    <Hash className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <span className="font-medium text-sm text-foreground truncate block">
                                        {channel.name}
                                    </span>
                                    {channel.lastMessageAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                            Active {formatDistanceToNow(channel.lastMessageAt, { addSuffix: false }).replace('about ', '')} ago
                                        </span>
                                    )}
                                </div>
                                {channel.unreadCount > 0 && (
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                                        {channel.unreadCount}
                                    </span>
                                )}
                            </Button>
                        ))
                    )}
                </div>
            </ScrollArea>

            <CreateGroupDialog
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
                ideaId={ideaId}
                onGroupCreated={(id) => onSelectChannel(id)}
            />
        </div>
    );
});

ChannelList.displayName = "ChannelList";

export default ChannelList;
