'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Sparkles } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50),
});

type NameInputFormProps = {
  onJoin: (name: string) => void;
};

export default function NameInputForm({ onJoin }: NameInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onJoin(values.name);
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit">
            <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold mt-4">Welcome to CollabSurf</CardTitle>
        <CardDescription>Enter your name to join the collaborative browsing session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Alex Doe" {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full text-lg py-6">Join Session</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
