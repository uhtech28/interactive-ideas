'use client'

import { LogOut, ListTodo, Calendar, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useClerk } from '@clerk/nextjs'
import React from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchBar } from '@/components/search/search-bar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GlobalChatSheet } from '@/components/chat/ChatInterface'

export const HeroHeader = ({
    searchQuery,
    onSearchChange,
    onOpenHierarchy,
    onOpenTodos,
    onOpenCalendar
}: {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onOpenHierarchy?: () => void;
    onOpenTodos?: () => void;
    onOpenCalendar?: () => void;
}) => {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const { signOut } = useClerk()
    const currentUser = useQuery(api.users.getCurrentUser)

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const pathname = usePathname()
    const isIdeaPage = pathname?.startsWith('/idea/') && pathname !== '/create-idea'

    return (
        <header className="relative">
            <nav className="fixed top-0 left-0 right-0 z-50 w-full">
                <div className={cn(
                    'mx-auto px-4 sm:px-6 transition-all duration-300 ease-in-out',
                    isScrolled
                        ? 'mt-0 md:mt-2 w-full bg-background/80 backdrop-blur-xl border-b md:border border-border/50 md:rounded-2xl shadow-lg'
                        : 'mt-0 w-full bg-background/80 backdrop-blur-xl border-b border-border/50'
                )}>
                    <div className="flex items-center justify-between h-16">
                        {/* Logo (md+) */}
                        <div className="flex-shrink-0 z-20 hidden md:block">
                            <Link href="/" aria-label="Home" className="flex items-center rounded-lg">
                                <LogoIcon />
                            </Link>
                        </div>

                        {/* Desktop search (md+) */}
                        <div className="hidden md:flex items-center justify-center flex-1 px-4">
                            <div className="max-w-md w-full">
                                <SearchBar
                                    value={searchQuery}
                                    onSearch={(query) => onSearchChange?.(query)}
                                    placeholder="Search for ideas..."
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Desktop actions (md+) — menu links + action icons */}
                        <div className="hidden md:flex items-center gap-2">
                            <SignedOut>
                                <div className="flex gap-3">
                                    <SignInButton><Button variant="ghost" size="sm">Login</Button></SignInButton>
                                    <SignUpButton><Button size="sm">Sign Up</Button></SignUpButton>
                                </div>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center gap-2">
                                    {/* Menu links — left of action icons */}
                                    <Link href="/feed" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded-md whitespace-nowrap">Feed</Link>
                                    <Link href="/my-ideas" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded-md whitespace-nowrap">My Ideas</Link>
                                    <Link href="/community" className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1 rounded-md whitespace-nowrap">Community</Link>

                                    <Link href="/create-idea">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="Post an idea" aria-label="Post an idea">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </Link>

                                    {isIdeaPage ? (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onOpenTodos} title="Todos" aria-label="Todos">
                                            <ListTodo className="h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <Link href="/todos">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="My todos" aria-label="My todos">
                                                <ListTodo className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    )}

                                    {isIdeaPage ? (
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onOpenCalendar} title="Calendar" aria-label="Calendar">
                                            <Calendar className="h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <Link href="/calendar">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" title="My calendar" aria-label="My calendar">
                                                <Calendar className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    )}

                                    <GlobalChatSheet />
                                    <NotificationBell />

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                                                    <AvatarFallback>{currentUser?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56" align="end" forceMount>
                                            <div className="grid gap-2">
                                                <Link href={`/profile/${currentUser?.username}`} className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted">
                                                    {currentUser?.displayName}
                                                    <p className="text-xs text-muted-foreground font-normal truncate">@{currentUser?.username}</p>
                                                </Link>
                                                <Button variant="ghost" className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </SignedIn>
                        </div>

                        {/* Mobile bar (<md) */}
                        <div className="flex md:hidden items-center justify-between w-full h-16 gap-2">
                            <Link href="/" className="flex-shrink-0 flex items-center text-primary">
                                <LogoIcon className="h-6 w-6" idSuffix="mobile" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <SearchBar
                                    value={searchQuery}
                                    onSearch={(query) => onSearchChange?.(query)}
                                    placeholder="Search..."
                                    className="w-full h-9 text-xs"
                                />
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1">
                                <SignedIn>
                                    <Link href="/create-idea">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Post">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </Link>
                                    {isIdeaPage ? (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onOpenTodos} aria-label="Todos">
                                            <ListTodo className="h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <Link href="/todos">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Todos">
                                                <ListTodo className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    )}
                                    {isIdeaPage ? (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onOpenCalendar} aria-label="Calendar">
                                            <Calendar className="h-5 w-5" />
                                        </Button>
                                    ) : (
                                        <Link href="/calendar">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Calendar">
                                                <Calendar className="h-5 w-5" />
                                            </Button>
                                        </Link>
                                    )}
                                    <GlobalChatSheet />
                                    <NotificationBell />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-1">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                                                    <AvatarFallback>{currentUser?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56" align="end">
                                            <div className="grid gap-2">
                                                <Link href={`/profile/${currentUser?.username}`} className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted">
                                                    {currentUser?.displayName}
                                                </Link>
                                                <Button variant="ghost" className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </SignedIn>
                                <SignedOut>
                                    <SignInButton><Button size="sm" variant="ghost" className="px-1 text-xs">Login</Button></SignInButton>
                                </SignedOut>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}