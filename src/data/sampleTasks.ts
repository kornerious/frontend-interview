import { CodeTask } from '@/types';

export const sampleTasks: CodeTask[] = [
  {
    id: 'task_custom_hook_1',
    title: 'Create a Custom Pagination Hook',
    description: `
Create a custom React hook called \`usePagination\` that handles pagination logic for a collection of items.

The hook should:
1. Accept a total number of items and items per page
2. Return the current page, total pages, and functions to navigate between pages
3. Handle edge cases (e.g., going beyond the first or last page)
4. Include an option to jump to a specific page

This hook should be reusable across different components that need pagination functionality.
`,
    difficulty: 'medium',
    startingCode: `
import { useState } from 'react';

export function usePagination(totalItems: number, itemsPerPage: number) {
  // Your implementation here
}

// Example usage:
// function ProductList({ products }) {
//   const { currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination(products.length, 10);
//   
//   const currentProducts = products.slice(
//     (currentPage - 1) * 10,
//     currentPage * 10
//   );
//   
//   return (
//     <div>
//       {/* Display products */}
//       <div className="pagination">
//         <button onClick={prevPage}>Previous</button>
//         <span>Page {currentPage} of {totalPages}</span>
//         <button onClick={nextPage}>Next</button>
//       </div>
//     </div>
//   );
// }
`,
    solutionCode: `
import { useState, useCallback } from 'react';

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  pageItems: number[];
}

export function usePagination(totalItems: number, itemsPerPage: number): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is within bounds when total changes
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  // Navigate to next page
  const nextPage = useCallback(() => {
    setCurrentPage(current => Math.min(current + 1, totalPages));
  }, [totalPages]);
  
  // Navigate to previous page
  const prevPage = useCallback(() => {
    setCurrentPage(current => Math.max(current - 1, 1));
  }, []);
  
  // Navigate to specific page
  const goToPage = useCallback((page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);
  
  // Calculate the indices of items to display
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
  
  // Generate array of indices for current page items
  const pageItems = Array.from(
    { length: endIndex - startIndex + 1 },
    (_, i) => startIndex + i
  );
  
  return {
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    pageItems
  };
}
`,
    testCases: [
      'The hook should initialize with page 1',
      'nextPage() should increment the current page, but not beyond totalPages',
      'prevPage() should decrement the current page, but not below 1',
      'goToPage() should set the current page to the specified value, clamped to valid range',
      'totalPages should be correctly calculated based on totalItems and itemsPerPage'
    ],
    hints: [
      'Remember to handle edge cases like zero items or when totalItems changes',
      'Use the useCallback hook to memoize functions for better performance',
      'Consider what happens when currentPage is greater than totalPages',
      'Make sure your returned pageItems array contains the correct indices'
    ],
    tags: ['react', 'hooks', 'custom hooks', 'pagination'],
    timeEstimate: 30
  },
  {
    id: 'task_typescript_interfaces',
    title: 'Create a Type-Safe API Client',
    description: `
Develop a type-safe API client using TypeScript interfaces and generics.

Your API client should:
1. Define interfaces for API responses and request parameters
2. Support GET, POST, PUT, and DELETE operations
3. Handle error responses properly with typed error objects
4. Use generics to provide type safety for different endpoint responses

Focus on creating a clean, reusable client that could be used throughout an application.
`,
    difficulty: 'hard',
    startingCode: `
// Define your types and interfaces here

// Implement the API client
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Implement get, post, put, delete methods
}

// Example usage:
// const api = new ApiClient('https://api.example.com');
// const users = await api.get<User[]>('/users');
`,
    solutionCode: `
// API Response types
interface ApiResponse<T> {
  data: T;
  status: number;
  success: boolean;
}

interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Request options interface
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
}

// Specific request options interfaces
interface GetRequestOptions extends RequestOptions {}

interface PostRequestOptions<T> extends RequestOptions {
  body: T;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Helper to build URL with query parameters
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(\`\${this.baseUrl}\${endpoint.startsWith('/') ? endpoint : \`/\${endpoint}\`}\`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  // Generic request method
  private async request<T>(
    method: string,
    endpoint: string,
    options?: RequestOptions & { body?: any }
  ): Promise<ApiResponse<T>> {
    try {
      const headers = {
        ...this.defaultHeaders,
        ...(options?.headers || {})
      };

      const response = await fetch(this.buildUrl(endpoint, options?.params), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: options?.timeout ? AbortSignal.timeout(options.timeout) : undefined
      });

      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await response.json() : await response.text();
      
      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
          code: data.code || 'UNKNOWN_ERROR',
          status: response.status
        } as ApiError;
      }

      return {
        data: data as T,
        status: response.status,
        success: true
      };
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      
      throw {
        message: (error as Error).message || 'Network error',
        code: 'NETWORK_ERROR',
        status: 0
      } as ApiError;
    }
  }

  // Public API methods
  public async get<T>(endpoint: string, options?: GetRequestOptions): Promise<T> {
    const response = await this.request<T>('GET', endpoint, options);
    return response.data;
  }

  public async post<T, U = any>(endpoint: string, options: PostRequestOptions<U>): Promise<T> {
    const response = await this.request<T>('POST', endpoint, options);
    return response.data;
  }

  public async put<T, U = any>(endpoint: string, options: PostRequestOptions<U>): Promise<T> {
    const response = await this.request<T>('PUT', endpoint, options);
    return response.data;
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>('DELETE', endpoint, options);
    return response.data;
  }
}
`,
    testCases: [
      'The client should correctly build URLs with query parameters',
      'GET requests should correctly parse JSON responses',
      'POST/PUT requests should properly serialize request bodies',
      'Error responses should be properly typed and include status codes',
      'The client should handle non-JSON responses'
    ],
    hints: [
      'Use TypeScript generics to provide type safety for different endpoint responses',
      'Consider using the Fetch API with proper type annotations',
      'Don\'t forget to handle different content types in responses',
      'Error handling should differentiate between network errors and API errors'
    ],
    tags: ['typescript', 'api', 'fetch', 'interfaces', 'generics'],
    timeEstimate: 45
  }
];

// Add more advanced tasks
export const advancedTasks: CodeTask[] = [
  {
    id: 'task_nextjs_data_fetching',
    title: 'Implement Optimized Data Fetching in Next.js',
    description: `
Create a Next.js page that demonstrates multiple data fetching strategies:

1. Create a blog post page that uses both getStaticProps and getStaticPaths with ISR
2. Implement proper loading states during static regeneration
3. Add client-side data fetching for comments using SWR or React Query
4. Create a fallback UI for pages that haven't been generated yet

Focus on performance optimization and the user experience during data loading.
`,
    difficulty: 'hard',
    startingCode: `
// pages/posts/[slug].js
import { useState } from 'react';
import { useRouter } from 'next/router';

// Implement getStaticPaths here

// Implement getStaticProps here

export default function BlogPost({ post }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  
  // Handle fallback state

  // Implement client-side fetching for comments

  return (
    <div>
      {/* Create blog post UI with loading states */}
    </div>
  );
}
`,
    solutionCode: `
// pages/posts/[slug].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';

// Data fetching function for SWR
const fetcher = (url) => fetch(url).then(res => res.json());

// Static paths to pre-render
export async function getStaticPaths() {
  // Fetch list of posts (in a real app, this would come from a CMS or API)
  const posts = [
    { slug: 'hello-world' },
    { slug: 'getting-started-with-nextjs' },
  ];
  
  return {
    paths: posts.map(post => ({
      params: { slug: post.slug }
    })),
    fallback: true // Enable fallback rendering for non-generated paths
  };
}

// Static props for each page
export async function getStaticProps({ params }) {
  try {
    // In a real app, fetch from an API
    const post = {
      slug: params.slug,
      title: params.slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      content: 'This is the content of the blog post...',
      date: new Date().toISOString()
    };
    
    return {
      props: {
        post
      },
      revalidate: 60 // Regenerate page every 60 seconds if requested
    };
  } catch (error) {
    return {
      notFound: true // Return 404 page for errors
    };
  }
}

export default function BlogPost({ post }) {
  const router = useRouter();
  
  // Use SWR for client-side data fetching of comments
  const { data: comments, error } = useSWR(
    // Only fetch comments when we have the post data
    router.isFallback || !post ? null : \`/api/comments/\${post.slug}\`,
    fetcher
  );
  
  // Show a loading state when the page is being generated
  if (router.isFallback) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <article>
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-500 mb-4">Published on {new Date(post.date).toLocaleDateString()}</p>
        <div className="prose max-w-none mb-8">
          {post.content}
        </div>
      </article>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        
        {!comments && !error ? (
          // Loading state for comments
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state for comments
          <div className="bg-red-50 p-4 rounded">
            <p className="text-red-500">Failed to load comments</p>
          </div>
        ) : comments.length === 0 ? (
          // Empty state for comments
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          // Comments list
          <ul className="space-y-4">
            {comments.map(comment => (
              <li key={comment.id} className="border-b pb-3">
                <p className="font-semibold">{comment.author}</p>
                <p className="text-gray-700">{comment.content}</p>
                <p className="text-xs text-gray-500">{new Date(comment.date).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
`,
    testCases: [
      'The page should display a loading state when in fallback mode',
      'getStaticPaths should return a limited set of paths with fallback enabled',
      'getStaticProps should include a revalidate option for ISR',
      'Comments should be fetched client-side with proper loading and error states',
      'The UI should adapt based on the loading state of both the post and comments'
    ],
    hints: [
      'Use router.isFallback to detect when a page is being generated',
      'Use Incremental Static Regeneration by setting the revalidate property',
      'Consider using SWR or React Query for data fetching with built-in loading states',
      'Create skeleton loaders for better UX during loading',
      'Handle both statically generated content and dynamically fetched content separately'
    ],
    tags: ['nextjs', 'data fetching', 'isr', 'swr', 'static paths'],
    timeEstimate: 60
  }
];

export const codeTasks = [...sampleTasks, ...advancedTasks];
