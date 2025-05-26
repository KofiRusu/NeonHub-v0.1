'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../../components/ui/accordion';
import { Separator } from '../../../../components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Copy, Check, RefreshCcw } from 'lucide-react';

const contentSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  contentType: z.enum([
    'BLOG_POST',
    'SOCIAL_POST',
    'EMAIL',
    'AD_COPY',
    'PRODUCT_DESCRIPTION',
    'LANDING_PAGE',
    'PRESS_RELEASE',
    'VIDEO_SCRIPT',
  ]),
  campaignId: z.string().optional(),
  platform: z
    .enum([
      'WEBSITE',
      'TWITTER',
      'LINKEDIN',
      'FACEBOOK',
      'INSTAGRAM',
      'EMAIL',
      'YOUTUBE',
      'TIKTOK',
      'OTHER',
    ])
    .optional(),
  targetAudience: z.string().min(5, {
    message: 'Target audience must be at least 5 characters.',
  }),
  keyPoints: z.string().min(10, {
    message: 'Key points must be at least 10 characters.',
  }),
  tone: z.enum([
    'PROFESSIONAL',
    'CASUAL',
    'FORMAL',
    'FRIENDLY',
    'HUMOROUS',
    'AUTHORITATIVE',
    'INSPIRATIONAL',
    'EDUCATIONAL',
  ]),
  length: z.enum(['SHORT', 'MEDIUM', 'LONG']),
});

export default function GenerateContent() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerateCount, setRegenerateCount] = useState(0);

  const form = useForm<z.infer<typeof contentSchema>>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: '',
      contentType: 'BLOG_POST',
      platform: 'WEBSITE',
      targetAudience: '',
      keyPoints: '',
      tone: 'PROFESSIONAL',
      length: 'MEDIUM',
    },
  });

  async function onSubmit(values: z.infer<typeof contentSchema>) {
    try {
      setIsGenerating(true);
      setGeneratedContent(null);

      // This would be replaced with an actual API call to the ContentAgent
      const response = await fetch('/api/agents/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.content);
      } else {
        throw new Error('Failed to generate content');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Handle error state
    } finally {
      setIsGenerating(false);
    }
  }

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = () => {
    setRegenerateCount((prev) => prev + 1);
    onSubmit(form.getValues());
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    try {
      // This would be replaced with an actual API call to save the content
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form.getValues(),
          content: generatedContent,
        }),
      });

      if (response.ok) {
        router.push('/marketing/content');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      // Handle error state
    }
  };

  // Mock data for campaign selection
  const campaigns = [
    { id: 'campaign-1', name: 'Summer Product Launch' },
    { id: 'campaign-2', name: 'Holiday Marketing' },
    { id: 'campaign-3', name: 'B2B Outreach Initiative' },
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Content Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate high-quality marketing content using our advanced AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Parameters</CardTitle>
            <CardDescription>
              Configure the inputs for the AI content generator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Title/Topic</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10 Ways to Improve Your Marketing ROI"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main subject or title for your content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BLOG_POST">Blog Post</SelectItem>
                            <SelectItem value="SOCIAL_POST">
                              Social Media Post
                            </SelectItem>
                            <SelectItem value="EMAIL">Email</SelectItem>
                            <SelectItem value="AD_COPY">Ad Copy</SelectItem>
                            <SelectItem value="PRODUCT_DESCRIPTION">
                              Product Description
                            </SelectItem>
                            <SelectItem value="LANDING_PAGE">
                              Landing Page Copy
                            </SelectItem>
                            <SelectItem value="PRESS_RELEASE">
                              Press Release
                            </SelectItem>
                            <SelectItem value="VIDEO_SCRIPT">
                              Video Script
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          What type of content do you need?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="campaignId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {campaigns.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this content to a campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WEBSITE">Website</SelectItem>
                          <SelectItem value="TWITTER">Twitter</SelectItem>
                          <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                          <SelectItem value="FACEBOOK">Facebook</SelectItem>
                          <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="TIKTOK">TikTok</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Where will this content be published?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Marketing professionals aged 25-45"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Who is the primary audience for this content?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keyPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Points</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List the main points you want to include in the content"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Outline the key messages, points or facts to include
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PROFESSIONAL">
                              Professional
                            </SelectItem>
                            <SelectItem value="CASUAL">Casual</SelectItem>
                            <SelectItem value="FORMAL">Formal</SelectItem>
                            <SelectItem value="FRIENDLY">Friendly</SelectItem>
                            <SelectItem value="HUMOROUS">Humorous</SelectItem>
                            <SelectItem value="AUTHORITATIVE">
                              Authoritative
                            </SelectItem>
                            <SelectItem value="INSPIRATIONAL">
                              Inspirational
                            </SelectItem>
                            <SelectItem value="EDUCATIONAL">
                              Educational
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          What tone should the content have?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select length" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SHORT">Short</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LONG">Long</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How long should the content be?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="advanced">
                    <AccordionTrigger>Advanced Options</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          Additional options will be available in a future
                          update
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    'Generate Content'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              AI-generated content based on your parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-primary" />
                <p className="text-center text-muted-foreground">
                  Our AI is crafting your content...
                </p>
              </div>
            ) : generatedContent ? (
              <div className="relative">
                <div className="whitespace-pre-wrap border p-4 rounded-md min-h-[24rem] bg-muted/40">
                  {generatedContent}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96">
                <p className="text-center text-muted-foreground">
                  Configure the parameters and click "Generate Content" to
                  create your content
                </p>
              </div>
            )}
          </CardContent>
          {generatedContent && (
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRegenerate}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button size="sm" onClick={handleSave}>
                Save Content
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
