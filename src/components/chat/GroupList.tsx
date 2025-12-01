import React, { memo } from "react";
import { useQuery } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Users, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";
import { formatDistanceToNow } from "date-fns";

interface GroupListProps {
  onSelectGroup?: (conversationId: Id<"conversations"> | undefined, ideaId: Id<"ideas">) => void;
  onClose: () => void;
}

const GroupList: React.FC<GroupListProps> = memo(({
  onClose,
}) => {
  const groups = useQuery(api.chat.getGroupConversationsList);
  const directConversations = useQuery(api.chat.getUserConversations);
  const { openChatWithUser, openGroupChat } = useChat();

  return (
    <div className="w-full h-full bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Chats
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="communities" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 shrink-0">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="communities">Communities</TabsTrigger>
            <TabsTrigger value="direct">Direct</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="communities" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full w-full">
            <div className="px-2 pb-2 space-y-1">
              {groups === undefined ? (
                 <div className="text-center text-muted-foreground py-8 text-xs">Loading communities...</div>
              ) : groups.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm px-6">
                  <div className="bg-muted/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p>No communities yet.</p>
                  <p className="text-xs mt-1 opacity-70">Join an idea to start chatting!</p>
                </div>
              ) : (
                groups.map((group) => (
                  <Button
                    key={group.ideaId}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 h-auto justify-start hover:bg-accent/50 transition-all duration-200 group relative overflow-hidden"
                    onClick={() => openGroupChat(group.ideaId, group.conversationId)}
                  >
                    {/* Gradient Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all text-white font-bold text-lg">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm text-foreground truncate pr-2">
                          {group.name}
                        </span>
                        {group.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(group.lastMessage.createdAt, { addSuffix: false }).replace('about ', '')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground truncate max-w-[85%]">
                          {group.lastMessage?.content || 'No messages yet'}
                        </span>
                        {group.unreadCount > 0 && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {group.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="direct" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full w-full">
            <div className="px-2 pb-2 space-y-1">
              {directConversations === undefined ? (
                 <div className="text-center text-muted-foreground py-8 text-xs">Loading messages...</div>
              ) : directConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm px-6">
                   <div className="bg-muted/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p>No direct messages.</p>
                  <p className="text-xs mt-1 opacity-70">Start a conversation from the community page!</p>
                </div>
              ) : (
                directConversations.map((convo) => (
                  <Button
                    key={convo._id}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 h-auto justify-start hover:bg-accent/50 transition-all duration-200"
                    onClick={() => {
                      if (convo.otherUser) {
                        openChatWithUser(convo.otherUser.id as Id<"users">);
                      }
                    }}
                  >
                    <Avatar className="w-12 h-12 border shrink-0">
                      <AvatarImage src={convo.otherUser?.avatar} alt={convo.otherUser?.displayName} />
                      <AvatarFallback>{convo.otherUser?.displayName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-left min-w-0 flex flex-col gap-0.5">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-sm text-foreground truncate pr-2">
                          {convo.otherUser?.displayName || "Unknown User"}
                        </span>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(convo.lastMessage.createdAt, { addSuffix: false }).replace('about ', '')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {convo.lastMessage?.content || 'No messages yet'}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
});

GroupList.displayName = 'GroupList';

export default GroupList;
