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
  CardFooter,
  CardHeader,
  CardTitle,
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const campaignSchema = z.object({
  name: z.string().min(2, {
    message: 'Campaign name must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  type: z.enum([
    'CONTENT_MARKETING',
    'EMAIL_CAMPAIGN',
    'SOCIAL_MEDIA',
    'SEO_OPTIMIZATION',
    'AD_CAMPAIGN',
    'PRODUCT_LAUNCH',
    'EVENT_PROMOTION',
    'BRAND_AWARENESS',
  ]),
  target: z.string().min(5, {
    message: 'Target audience must be at least 5 characters.',
  }),
  budget: z.string().optional(),
  goals: z.string().min(5, {
    message: 'Campaign goals must be at least 5 characters.',
  }),
});

export default function CreateCampaign() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof campaignSchema>>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'CONTENT_MARKETING',
      target: '',
      budget: '',
      goals: '',
    },
  });

  async function onSubmit(values: z.infer<typeof campaignSchema>) {
    try {
      setIsSubmitting(true);

      // This would be replaced with an actual API call
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        router.push('/marketing/campaigns');
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      // Handle error state
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Campaign</h1>
        <p className="text-muted-foreground mt-2">
          Create an AI-powered marketing campaign with smart content generation
          and outreach
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            Enter the details of your new marketing campaign
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Summer Product Launch" {...field} />
                    </FormControl>
                    <FormDescription>
                      Choose a descriptive name for your campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the campaign objectives and scope"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about what this campaign aims to achieve
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CONTENT_MARKETING">
                            Content Marketing
                          </SelectItem>
                          <SelectItem value="EMAIL_CAMPAIGN">
                            Email Campaign
                          </SelectItem>
                          <SelectItem value="SOCIAL_MEDIA">
                            Social Media
                          </SelectItem>
                          <SelectItem value="SEO_OPTIMIZATION">
                            SEO Optimization
                          </SelectItem>
                          <SelectItem value="AD_CAMPAIGN">
                            Ad Campaign
                          </SelectItem>
                          <SelectItem value="PRODUCT_LAUNCH">
                            Product Launch
                          </SelectItem>
                          <SelectItem value="EVENT_PROMOTION">
                            Event Promotion
                          </SelectItem>
                          <SelectItem value="BRAND_AWARENESS">
                            Brand Awareness
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of marketing campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="$5,000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Estimated budget for this campaign
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Young professionals aged 25-34"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Define the primary audience for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Increase brand awareness by 20%, generate 300 qualified leads"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Define measurable goals for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/marketing')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
