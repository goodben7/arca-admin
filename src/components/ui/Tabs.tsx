'use client';

import * as React from "react"
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react"
import { cn } from "@/lib/utils"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <TabList
        ref={ref}
        className={cn(
            "inline-flex h-12 p-1.5 items-center justify-center rounded-xl bg-secondary-100/50 text-secondary-500",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
    <Tab
        ref={ref}
        className={({ selected }) => cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-bold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            selected
                ? "bg-white text-primary-700 shadow-sm shadow-primary-100"
                : "text-secondary-500 hover:bg-white/50 hover:text-secondary-900",
            className
        )}
        {...props}
    />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <TabPanel
        ref={ref}
        className={cn(
            "mt-6 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 animate-in fade-in slide-in-from-top-2 duration-300",
            className
        )}
        {...props}
    />
))
TabsContent.displayName = "TabsContent"

export { TabGroup as TabsProvider, TabsList, TabsTrigger, TabsContent, TabPanels as TabsPanels }
