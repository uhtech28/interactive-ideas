"use client";

import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CreateIdeaPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    customCategory: '',
    visibility: 'public' as 'public' | 'private'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Character counts
  const titleCount = formData.title.length;
  const descriptionCount = formData.description.length;

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

  // Initialize Convex mutation
  const createIdea = useMutation(api.ideas.createIdea);

  // Validation function
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Idea title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    } else if (formData.category === 'other' && !formData.customCategory.trim()) {
      newErrors.customCategory = 'Please specify a custom category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form handlers
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      // Handle category
      const finalCategory = formData.category === 'other'
        ? formData.customCategory.trim()
        : formData.category;

      // Create idea via Convex mutation
      await createIdea({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: finalCategory,
        visibility: formData.visibility,
      });

      // Success - redirect to feed
      router.push('/feed');
    } catch (error) {
      console.error('Failed to create idea:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create idea. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  React.useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/');
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <HeroHeader />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeroHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/feed">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feed
              </Link>
            </Button>
          </div>

          {/* Main Card */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Create New Idea</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Idea Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Idea Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter a compelling title for your idea"
                    className={errors.title ? 'border-destructive' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {titleCount}/100 characters
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your idea in detail..."
                    rows={6}
                    className={errors.description ? 'border-destructive' : ''}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {descriptionCount}/500 characters
                  </p>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className={`w-full h-9 px-3 py-1 text-base rounded-md border bg-transparent outline-none focus:border-ring focus-visible:ring-ring/50 shadow-xs transition-[color,box-shadow] md:text-sm ${errors.category ? 'border-destructive' : 'border-border'}`}
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>

                {/* Custom Category Input */}
                {formData.category === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customCategory" className="text-sm font-medium">
                      Custom Category <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="customCategory"
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) => handleInputChange('customCategory', e.target.value)}
                      placeholder="Enter your custom category"
                      className={errors.customCategory ? 'border-destructive' : ''}
                    />
                    {errors.customCategory && (
                      <p className="text-sm text-destructive">{errors.customCategory}</p>
                    )}
                  </div>
                )}

                {/* Visibility */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Visibility <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'private')}
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
                        checked={formData.visibility === 'private'}
                        onChange={(e) => handleInputChange('visibility', e.target.value as 'public' | 'private')}
                        className="w-4 h-4 text-primary border-border focus:ring-ring focus:ring-2"
                      />
                      <div>
                        <div className="font-medium text-sm">Private</div>
                        <div className="text-xs text-muted-foreground">Visible only to your connections</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive">{errors.submit}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Creating Your Idea...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Create Idea
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}