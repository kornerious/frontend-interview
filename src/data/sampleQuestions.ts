import { Question } from '@/types';

// Original questions without filtering
const allQuestions: Question[] = [

  {
    id: 'react_hooks_1',
    topic: 'React Hooks',
    level: 'easy',
    type: 'mcq',
    question: 'What is the correct way to declare state in a functional component using hooks?',
    answer: 'const [state, setState] = useState(initialValue);',
    options: [
      'const [state, setState] = useState(initialValue);',
      'const state = useState(initialValue);',
      'const {state, setState} = useState(initialValue);',
      'useState(initialValue, state, setState);'
    ],
    example: `
\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
\`\`\``,
    tags: ['react', 'hooks', 'useState']
  },
  {
    id: 'react_hooks_2',
    topic: 'React Hooks',
    level: 'medium',
    type: 'mcq',
    question: 'Which hook should be used for side effects in a functional component?',
    answer: 'useEffect',
    options: [
      'useEffect',
      'useState',
      'useContext',
      'useReducer'
    ],
    analysisPoints: ['side effects', 'data fetching', 'DOM manipulation', 'subscriptions'],
    example: `
\`\`\`jsx
import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [userId]); // Re-run when userId changes
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
    </div>
  );
}
\`\`\``,
    tags: ['react', 'hooks', 'useEffect', 'side effects']
  },
  {
    id: 'react_hooks_3',
    topic: 'React Hooks',
    level: 'hard',
    type: 'open',
    question: 'Explain the difference between useMemo and useCallback hooks, and provide an example of when to use each.',
    answer: "useMemo is used to memoize computed values to prevent expensive recalculations on every render. It only recomputes the memoized value when one of the dependencies has changed. Example: `const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);`\n\nuseCallback is used to memoize callback functions to prevent unnecessary recreations of functions on every render. This is particularly useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders. Example: `const memoizedCallback = useCallback(() => { doSomething(a, b); }, [a, b]);`",
    keyConcepts: [
      "useMemo memoizes values", 
      "useCallback memoizes functions", 
      "prevent recalculation", 
      "dependency array", 
      "reference equality", 
      "performance optimization", 
      "expensive calculations", 
      "prevent recreating functions"
    ],
    example: `
\`\`\`jsx
import React, { useState, useMemo, useCallback } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [todos, setTodos] = useState([]);
  
  // useMemo example: expensive computation
  const expensiveCalculation = useMemo(() => {
    console.log("Computing...");
    let result = 0;
    for (let i = 0; i < 1000000000; i++) {
      result += i;
    }
    return result;
  }, []); // Empty array means it only calculates once
  
  // useCallback example: stable function reference
  const addTodo = useCallback((text) => {
    setTodos([...todos, text]);
  }, [todos]);
  
  return (
    <div>
      <div>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
      </div>
      <div>
        <p>Expensive calculation: {expensiveCalculation}</p>
      </div>
      <TodoList todos={todos} addTodo={addTodo} />
    </div>
  );
}

// This component uses React.memo to prevent unnecessary renders
const TodoList = React.memo(({ todos, addTodo }) => {
  console.log("TodoList rendered");
  return (
    <div>
      <input 
        type="text" 
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            addTodo(e.target.value);
            e.target.value = '';
          }
        }} 
      />
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>{todo}</li>
        ))}
      </ul>
    </div>
  );
});
\`\`\``,
    tags: ['react', 'hooks', 'useMemo', 'useCallback', 'performance', 'optimization']
  },
  {
    id: 'typescript_1',
    topic: 'TypeScript',
    level: 'medium',
    type: 'mcq',
    question: 'What is the main difference between an interface and a type alias in TypeScript?',
    answer: 'Interfaces can be extended or implemented and support declaration merging, while type aliases are more flexible for representing unions, intersections, and primitive types.',
    options: [
      'Interfaces can be extended or implemented and support declaration merging, while type aliases are more flexible for representing unions, intersections, and primitive types.',
      'Type aliases are faster at compile time than interfaces.',
      'Interfaces can only define object shapes while type aliases can only define primitive types.',
      'There is no difference; they can be used interchangeably in all cases.'
    ],
    example: `
\`\`\`typescript
// Interface
interface User {
  id: number;
  name: string;
}

// Interface extension
interface Employee extends User {
  department: string;
}

// Declaration merging
interface User {
  email: string; // Adds to existing User interface
}

// Type alias
type UserType = {
  id: number;
  name: string;
}

// Union type (can't do this with interface)
type ID = number | string;

// Intersection type
type EmployeeType = UserType & {
  department: string;
};
\`\`\``,
    tags: ['typescript', 'interface', 'type alias']
  },
  {
    id: 'typescript_2',
    topic: 'TypeScript',
    level: 'hard',
    type: 'code',
    question: 'Implement a TypeScript generic function to safely access deeply nested properties in an object, returning undefined if any part of the path is undefined.',
    answer: `
\`\`\`typescript
function getNestedValue<T, K extends keyof T>(
  obj: T,
  key: K
): T[K];

function getNestedValue<T, K extends keyof T, L extends keyof T[K]>(
  obj: T,
  key: K,
  key2: L
): T[K][L];

function getNestedValue<T, K extends keyof T, L extends keyof T[K], M extends keyof T[K][L]>(
  obj: T,
  key: K,
  key2: L,
  key3: M
): T[K][L][M];

function getNestedValue(obj: any, ...keys: string[]): any {
  return keys.reduce((acc, key) => {
    return acc === undefined ? undefined : acc[key];
  }, obj);
}
\`\`\``,
    example: `
\`\`\`typescript
interface User {
  name: string;
  address?: {
    street: string;
    city: string;
    zipCode: string;
  };
  profile?: {
    settings?: {
      darkMode: boolean;
    };
  };
}

const user: User = {
  name: 'John Doe',
  address: {
    street: '123 Main St',
    city: 'Boston',
    zipCode: '02108'
  }
};

// Usage examples
console.log(getNestedValue(user, 'name')); // 'John Doe'
console.log(getNestedValue(user, 'address', 'city')); // 'Boston'
console.log(getNestedValue(user, 'profile', 'settings', 'darkMode')); // undefined (safely)
\`\`\``,
    tags: ['typescript', 'generics', 'type safety', 'utility functions']
  },
  {
    id: 'javascript_arrays_1',
    topic: 'JavaScript Arrays',
    level: 'easy',
    type: 'mcq',
    question: 'Which array method would you use to create a new array containing only elements that pass a specified condition?',
    answer: 'filter()',
    options: [
      'filter()',
      'map()',
      'reduce()',
      'forEach()'
    ],
    example: `
\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Get only even numbers
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log(evenNumbers); // [2, 4, 6, 8, 10]

// More complex example with objects
const employees = [
  { name: 'Alice', department: 'Engineering', salary: 85000 },
  { name: 'Bob', department: 'Marketing', salary: 75000 },
  { name: 'Charlie', department: 'Engineering', salary: 90000 },
  { name: 'Diana', department: 'HR', salary: 65000 }
];

// Get only engineering employees with salary > 80000
const highPaidEngineers = employees.filter(
  emp => emp.department === 'Engineering' && emp.salary > 80000
);
console.log(highPaidEngineers);
// [{ name: 'Alice', department: 'Engineering', salary: 85000 },
//  { name: 'Charlie', department: 'Engineering', salary: 90000 }]
\`\`\``,
    tags: ['javascript', 'arrays', 'filter']
  },
  {
    id: 'javascript_arrays_2',
    topic: 'JavaScript Arrays',
    level: 'medium',
    type: 'code',
    question: 'Write a function that groups an array of objects by a specified property.',
    answer: `
\`\`\`javascript
function groupBy(array, property) {
  return array.reduce((grouped, item) => {
    const key = typeof property === 'function' 
      ? property(item) 
      : item[property];
    
    grouped[key] = grouped[key] || [];
    grouped[key].push(item);
    
    return grouped;
  }, {});
}
\`\`\``,
    example: `
\`\`\`javascript
const people = [
  { name: 'Alice', age: 25, city: 'New York' },
  { name: 'Bob', age: 30, city: 'Boston' },
  { name: 'Charlie', age: 35, city: 'New York' },
  { name: 'Diana', age: 25, city: 'Chicago' }
];

// Group by city
const byCity = groupBy(people, 'city');
console.log(byCity);
/*
{
  'New York': [
    { name: 'Alice', age: 25, city: 'New York' },
    { name: 'Charlie', age: 35, city: 'New York' }
  ],
  'Boston': [
    { name: 'Bob', age: 30, city: 'Boston' }
  ],
  'Chicago': [
    { name: 'Diana', age: 25, city: 'Chicago' }
  ]
}
*/

// Group by age
const byAge = groupBy(people, 'age');
console.log(byAge);

// Group by custom function
const byFirstLetter = groupBy(people, item => item.name[0]);
console.log(byFirstLetter);
\`\`\``,
    tags: ['javascript', 'arrays', 'reduce', 'grouping']
  },
  {
    id: 'react_performance_1',
    topic: 'React Performance',
    level: 'medium',
    type: 'open',
    question: 'Explain what "code splitting" is in React and how it improves performance.',
    answer: `
Code splitting is a technique that allows you to split your JavaScript bundle into smaller chunks that can be loaded on demand, rather than loading the entire application upfront. This improves performance by:

1. Reducing the initial load time of your application
2. Loading only the code that is needed for the current view
3. Deferring loading of non-critical components until they are needed

In React, code splitting can be implemented using:

1. \`React.lazy()\` - For component-based code splitting
2. \`import()\` - Dynamic imports for on-demand loading of modules
3. \`Suspense\` - To show fallback content while components are loading

This is particularly useful for large applications where users may only interact with a small portion of the app during a session.`,
    example: `
\`\`\`jsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Regular import
import Home from './components/Home';

// Lazy-loaded components
const About = lazy(() => import('./components/About'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Settings = lazy(() => import('./components/Settings'));

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/settings">Settings</a></li>
          </ul>
        </nav>
        
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}
\`\`\``,
    tags: ['react', 'performance', 'code splitting', 'lazy loading']
  },
  {
    id: 'react_performance_2',
    topic: 'React Performance',
    level: 'hard',
    type: 'code',
    question: 'Implement a custom hook called useDebounce that delays the update of a value for a specified amount of time.',
    answer: `
\`\`\`typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Set up timeout to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Clean up the timeout if value changes (or component unmounts)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
\`\`\``,
    example: `
\`\`\`tsx
import React, { useState } from 'react';
import useDebounce from './useDebounce';

function SearchComponent() {
  // State for the immediate search term input
  const [searchTerm, setSearchTerm] = useState('');
  // State for search results
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce the search term so the API isn't called on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Effect for API call
  useEffect(() => {
    if (debouncedSearchTerm) {
      setIsSearching(true);
      fetchSearchResults(debouncedSearchTerm)
        .then(results => {
          setIsSearching(false);
          setResults(results);
        });
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      
      {isSearching && <div>Searching...</div>}
      
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.name}</li>
        ))}
      </ul>
    </div>
  );
}

// Mock API call
function fetchSearchResults(term) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 1, name: \`Result for \${term} - 1\` },
        { id: 2, name: \`Result for \${term} - 2\` }
      ]);
    }, 200);
  });
}
\`\`\``,
    tags: ['react', 'hooks', 'custom hooks', 'performance', 'debounce']
  },
  {
    id: 'nextjs_1',
    topic: 'Next.js',
    level: 'medium',
    type: 'mcq',
    question: 'Which Next.js data fetching method would you use for a page that needs to be generated on each request with user-specific data?',
    answer: 'getServerSideProps',
    options: [
      'getServerSideProps',
      'getStaticProps',
      'getStaticPaths',
      'getInitialProps'
    ],
    example: `
\`\`\`jsx
// pages/dashboard.js
export async function getServerSideProps(context) {
  // Get the user's session
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  // Fetch data based on the user's session
  const response = await fetch(\`https://api.example.com/dashboard/\${session.user.id}\`);
  const dashboardData = await response.json();
  
  // Pass the data to the page
  return {
    props: {
      user: session.user,
      dashboardData,
    },
  };
}

export default function Dashboard({ user, dashboardData }) {
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <div>
        {dashboardData.map(item => (
          <div key={item.id}>{item.title}</div>
        ))}
      </div>
    </div>
  );
}
\`\`\``,
    tags: ['nextjs', 'data fetching', 'SSR', 'getServerSideProps']
  },
  {
    id: 'nextjs_2',
    topic: 'Next.js',
    level: 'hard',
    type: 'open',
    question: 'Compare and contrast the different data fetching methods in Next.js (getStaticProps, getServerSideProps, and getStaticPaths) and explain when to use each one.',
    answer: `
# Next.js Data Fetching Methods Comparison:

## getStaticProps
- **Purpose**: Pre-renders page at build time
- **When to use**: 
  - Pages with static content that doesn't change often
  - SEO-critical pages that need to be indexed by search engines
  - High-traffic pages where performance is critical
- **Advantages**: 
  - Best performance (pre-generated HTML)
  - Lower server costs (pages generated once)
  - Great for SEO
- **Disadvantages**:
  - Data may become stale unless using ISR (Incremental Static Regeneration)
  - Not suitable for user-specific or frequently changing data

## getServerSideProps
- **Purpose**: Generates page HTML on each request (SSR)
- **When to use**: 
  - Pages with user-specific data (dashboard, profile)
  - Pages with data that must be fresh on every request
  - Pages requiring request-time information (cookies, headers)
- **Advantages**: 
  - Always shows fresh data
  - Can access request-specific data
  - Still good for SEO
- **Disadvantages**:
  - Slower than static pages (server must render on each request)
  - Higher server load
  - TTFB (Time To First Byte) is higher

## getStaticPaths
- **Purpose**: Specifies which paths of a dynamic route should be pre-rendered
- **When to use**: 
  - With dynamic routes (e.g., \`[id].js\`, \`[slug].js\`)
  - When using getStaticProps with dynamic routes
  - For creating static pages for a subset of possible dynamic routes
- **Advantages**: 
  - Control over which pages are pre-generated
  - Can use fallback modes for paths not generated at build time
- **Disadvantages**:
  - Complex to set up for routes with many possible values
  - May increase build time for many paths

## Key Decision Factors:
1. **Content update frequency**: Static for rarely changing, server-side for frequently changing
2. **Personalization**: Server-side for user-specific content
3. **Performance needs**: Static for best performance
4. **SEO importance**: Both work, but static is better for high-traffic pages
5. **Build time constraints**: Consider build duration if pre-rendering many pages`,
    example: `
\`\`\`jsx
// Example 1: getStaticProps - Blog post page
// pages/blog/[slug].js
export async function getStaticProps({ params }) {
  const post = await fetchBlogPost(params.slug);
  return {
    props: { post },
    revalidate: 3600, // Re-generate after 1 hour
  };
}

export async function getStaticPaths() {
  const posts = await fetchMostPopularPosts();
  
  return {
    paths: posts.map(post => ({ 
      params: { slug: post.slug } 
    })),
    fallback: 'blocking', // Generate other pages on demand
  };
}

// Example 2: getServerSideProps - User dashboard
// pages/dashboard.js
export async function getServerSideProps({ req }) {
  const session = await getSession({ req });
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  const userStats = await fetchUserStats(session.user.id);
  
  return {
    props: {
      user: session.user,
      stats: userStats,
      lastUpdated: new Date().toISOString(),
    },
  };
}
\`\`\``,
    tags: ['nextjs', 'data fetching', 'SSR', 'SSG', 'ISR', 'getStaticProps', 'getServerSideProps', 'getStaticPaths']
  }
];

// Export filtered questions by removing completed ones
export const sampleQuestions: Question[] = allQuestions;
