import React, { memo } from "react";
import { useQuery } from "convex/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useChat } from "./ChatContext";

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
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-foreground">Messages</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="direct" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="direct">Direct</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="direct" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full w-full">
            <div className="p-2 space-y-1">
              {directConversations === undefined ? (
                 <div className="text-center text-muted-foreground py-4 text-sm">Loading...</div>
              ) : directConversations.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm italic px-4">
                  No direct messages yet. Start a conversation from the community page!
                </div>
              ) : (
                directConversations.map((convo) => (
                  <Button
                    key={convo._id}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent focus:bg-accent border-0 h-auto justify-start"
                    onClick={() => {
                      if (convo.otherUser) {
                        openChatWithUser(convo.otherUser.id as Id<"users">);
                      }
                    }}
                  >
                    <Avatar className="w-10 h-10 border shrink-0">
                      <AvatarImage src={convo.otherUser?.avatar} alt={convo.otherUser?.displayName} />
                      <AvatarFallback>{convo.otherUser?.displayName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {convo.otherUser?.displayName || "Unknown User"}
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

        <TabsContent value="groups" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full w-full">
            <div className="p-2 space-y-1">
              {groups === undefined ? (
                 <div className="text-center text-muted-foreground py-4 text-sm">Loading...</div>
              ) : groups.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm italic px-4">
                  No idea groups found. Join an idea to start chatting!
                </div>
              ) : (
                groups.map((group) => (
                  <Button
                    key={group.ideaId}
                    variant="ghost"
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent focus:bg-accent border-0 h-auto justify-start"
                    onClick={() => openGroupChat(group.ideaId, group.conversationId)}
                  >
                    <Avatar className="w-10 h-10 border bg-primary/10 shrink-0">
                      <AvatarImage src={undefined} alt={group.name} />
                      <AvatarFallback><Users className="w-5 h-5 text-primary" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {group.lastMessage?.content || 'No messages yet'}
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
