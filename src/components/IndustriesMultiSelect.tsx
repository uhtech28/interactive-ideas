"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { industryCardOptions } from "@/lib/options";

export interface IndustryOption {
  value: string;
  label: string;
}

// Explicit group mapping keyed by option value — aligned with the Industry Cards document
const INDUSTRY_GROUP_MAP: Record<string, string> = {
  "Software and Technology": "Technology & Digital",
  "Telecommunications": "Technology & Digital",
  "Consumer Electronics": "Technology & Digital",

  "Healthcare and Life Sciences": "Healthcare",

  "Finance": "Finance",

  "Chemicals": "Manufacturing & Industrial",
  "Metals and Mining": "Manufacturing & Industrial",
  "Manufacturing (General)": "Manufacturing & Industrial",
  "Industrial Equipment and Services": "Manufacturing & Industrial",

  "Media and Entertainment": "Media & Entertainment",
  "Creator Economy": "Media & Entertainment",

  "Automobiles and Private Transportation": "Transportation & Logistics",
  "Public Transportation": "Transportation & Logistics",
  "Aerospace and Aviation": "Transportation & Logistics",
  "Logistics and Supply Chain": "Transportation & Logistics",

  "Household Goods and Appliances": "Consumer Goods & Retail",
  "Food, Beverage, Tobacco, and Consumables": "Consumer Goods & Retail",
  "Retail and Commerce": "Consumer Goods & Retail",
  "Textiles and Apparel": "Consumer Goods & Retail",

  "Energy": "Energy & Utilities",
  "Utilities": "Energy & Utilities",

  "Real Estate": "Real Estate & Construction",
  "Construction and Building Materials": "Real Estate & Construction",

  "Travel, Tourism, and Hospitality": "Hospitality & Tourism",

  "Agriculture and Natural Resources": "Agriculture & Environment",
  "Environmental and Social Impact": "Agriculture & Environment",

  "Defence and Security": "Defence & Security",
  "Security and Risk Management": "Defence & Security",

  "Education and Academia": "Education",

  "Labour and Workforce": "Business Services",
  "Corporate and Management Services": "Business Services",
  "Sales and Marketing": "Business Services",
  "Professional Services": "Business Services",

  "Sports Industry": "Lifestyle & Culture",
  "Religious and Cultural Institutions": "Lifestyle & Culture",
  "Pet Industry": "Lifestyle & Culture",
  "Luxury Industry": "Lifestyle & Culture",

  "Government and Public Administration": "Government & Public",
  "Research and Development": "Government & Public",

  "Space Economy": "Emerging Industries",
};

const GROUP_ORDER = [
  "Technology & Digital",
  "Healthcare",
  "Finance",
  "Manufacturing & Industrial",
  "Media & Entertainment",
  "Transportation & Logistics",
  "Consumer Goods & Retail",
  "Energy & Utilities",
  "Real Estate & Construction",
  "Hospitality & Tourism",
  "Agriculture & Environment",
  "Defence & Security",
  "Education",
  "Business Services",
  "Lifestyle & Culture",
  "Government & Public",
  "Emerging Industries",
  "Other",
];

const buildIndustryGroups = (industries: IndustryOption[]) => {
  const groups: Record<string, IndustryOption[]> = {};
  for (const ind of industries) {
    const group = INDUSTRY_GROUP_MAP[ind.value] ?? "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(ind);
  }
  return GROUP_ORDER
    .filter(g => groups[g])
    .map(g => ({ group: g, items: groups[g] }));
};

const INDUSTRY_GROUPS = buildIndustryGroups(industryCardOptions);

interface IndustriesMultiSelectProps {
  selectedIndustries: string[];
  onChange: (industries: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  singleSelect?: boolean;
  mandatoryIndustries?: string[];
  hideBadges?: boolean;
}

export function IndustriesMultiSelect({
  selectedIndustries,
  onChange,
  placeholder = "Select industries...",
  maxSelection,
  singleSelect = false,
  mandatoryIndustries = [],
  hideBadges = false,
}: IndustriesMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredIndustries = useMemo(() => {
    if (!searchValue) return INDUSTRY_GROUPS;

    return INDUSTRY_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.value.toLowerCase().includes(searchValue.toLowerCase())
      ),
    })).filter(group => group.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    let newSelected: string[];

    if (singleSelect) {
      // Single select mode
      newSelected = selectedIndustries.includes(value) ? [] : [value];
    } else {
      // Multi select mode
      newSelected = selectedIndustries.includes(value)
        ? mandatoryIndustries.includes(value)
          ? selectedIndustries // Cannot remove mandatory industries
          : selectedIndustries.filter(industry => industry !== value)
        : maxSelection && selectedIndustries.length >= maxSelection
          ? selectedIndustries
          : [...selectedIndustries, value];
    }

    onChange(newSelected);
  };

  const displayValue = selectedIndustries.length > 0
    ? singleSelect
      ? selectedIndustries[0]
      : `${selectedIndustries.length} selected`
    : placeholder;

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-w-0"
          >
            <span className="truncate text-left flex-1 min-w-0">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 flex flex-col h-[min(50dvh,420px)] overflow-hidden"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput
              placeholder="Search industries..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="flex-1 overflow-y-auto max-h-none">
              <CommandEmpty>No industries found.</CommandEmpty>
              {filteredIndustries.map(group => (
                <CommandGroup key={group.group} heading={group.group} className="hidden md:block">
                  {group.items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      {singleSelect ? (
                        <>
                          {selectedIndustries.includes(item.value) && (
                            <Check className="mr-2 h-4 w-4 opacity-50" />
                          )}
                          {item.label}
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(item.value)}
                            className="mr-2"
                            readOnly
                          />
                          {item.label}
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {/* Mobile view with collapsed groups */}
              <div className="md:hidden">
                <CommandGroup>
                  <div className="px-1 py-2 text-sm font-semibold text-muted-foreground">All Industries</div>
                  {filteredIndustries.flatMap(group =>
                    group.items.map(item => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={() => handleSelect(item.value)}
                        className="cursor-pointer"
                      >
                        {singleSelect ? (
                          <>
                            {selectedIndustries.includes(item.value) && (
                              <Check className="mr-2 h-4 w-4 opacity-50" />
                            )}
                            {item.label}
                          </>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={selectedIndustries.includes(item.value)}
                              className="mr-2"
                              readOnly
                            />
                            {item.label}
                          </>
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Industries Badges */}
      {!hideBadges && selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1 transition-all duration-300">
          {selectedIndustries.map((industry) => {
            const isMandatory = mandatoryIndustries.includes(industry);
            return (
              <Badge
                key={industry}
                variant="outline"
                className="pl-2.5 pr-1.5 py-0.5 flex items-center gap-1 max-w-full text-[11px] font-medium bg-purple-500/10 border-purple-500/20 text-purple-600 rounded-lg hover:bg-purple-500/15 transition-all duration-200 animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="truncate">{industry}</span>
                {!isMandatory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(industry);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    className="ml-1 shrink-0 hover:bg-red-500/20 text-purple-600/60 hover:text-red-400 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                    aria-label={`Remove ${industry}`}
                  >
                    <X className="h-3 w-3 pointer-events-none" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}