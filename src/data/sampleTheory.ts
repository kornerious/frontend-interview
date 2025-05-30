import { TheoryBlock } from '@/types';

export const sampleTheoryBlocks: TheoryBlock[] = [
  {
    id: 'react_hooks_basics',
    title: 'React Hooks Fundamentals',
    content: `
# React Hooks Fundamentals

React Hooks were introduced in React 16.8 as a way to use state and other React features without writing a class component. Hooks let you "hook into" React state and lifecycle features from function components.

## Core Hooks

1. **useState** - Adds state to functional components
2. **useEffect** - Handles side effects in functional components
3. **useContext** - Subscribes to React context
4. **useReducer** - Alternative to useState for complex state logic
5. **useCallback** - Returns a memoized callback function
6. **useMemo** - Returns a memoized value
7. **useRef** - Creates a mutable ref object

## Rules of Hooks

1. Only call hooks at the top level of your component
2. Only call hooks from React function components or custom hooks
    `,
    examples: [
      {
        id: 'useState_example',
        title: 'useState Hook Example',
        code: `import React, { useState } from 'react';

function Counter() {
  // Declare a state variable called "count" with initial value 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}`,
        explanation: 'This example demonstrates how to use the useState hook to add state to a functional component. The useState hook returns a pair: the current state value and a function to update it.',
        language: 'tsx'
      },
      {
        id: 'useEffect_example',
        title: 'useEffect Hook Example',
        code: `import React, { useState, useEffect } from 'react';

function WindowSizeTracker() {
  // State to store window width
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty array ensures effect runs only on mount and unmount
  
  return (
    <div>
      <p>Current window width: {windowWidth}px</p>
    </div>
  );
}`,
        explanation: 'This example shows how to use the useEffect hook to handle side effects like subscribing to browser events. The cleanup function is returned to prevent memory leaks.',
        language: 'tsx'
      }
    ],
    relatedQuestions: ['react_hooks_1', 'react_hooks_2', 'react_hooks_3'],
    relatedTasks: ['task_custom_hook_1'],
    tags: ['react', 'hooks', 'functional components'],
    technology: 'React'
  },
  {
    id: 'typescript_interfaces_types',
    title: 'TypeScript Interfaces vs Types',
    content: `
# TypeScript: Interfaces vs Types

TypeScript offers two primary ways to define object types: interfaces and type aliases. While they share many similarities, there are important differences to understand.

## Interfaces

Interfaces are a powerful way to define contracts within your code and with code outside of your project.

- Can be extended with the \`extends\` keyword
- Can be merged when declared multiple times (declaration merging)
- Generally preferred for public API definitions

## Type Aliases

Type aliases create a new name for a type. They are similar to interfaces but have some unique capabilities.

- Can represent primitive types, unions, tuples, and other complex types
- Cannot be extended or implemented like interfaces
- Cannot be re-opened to add new properties

## When to Use Each

- Use **interfaces** for defining public APIs and when you want to take advantage of declaration merging
- Use **type aliases** for unions, intersections, or when you need to create complex types
    `,
    examples: [
      {
        id: 'interface_example',
        title: 'Interface Example',
        code: `// Interface declaration
interface User {
  id: number;
  name: string;
  email?: string; // Optional property
}

// Interface extension
interface Employee extends User {
  department: string;
  salary: number;
}

// Declaration merging
interface User {
  createdAt: Date; // Added to original interface
}

const employee: Employee = {
  id: 123,
  name: 'John Doe',
  department: 'Engineering',
  salary: 75000,
  createdAt: new Date()
};`,
        explanation: 'This example demonstrates interfaces in TypeScript, showing extension, optional properties, and declaration merging.',
        language: 'typescript'
      },
      {
        id: 'type_alias_example',
        title: 'Type Alias Example',
        code: `// Type alias for an object
type User = {
  id: number;
  name: string;
  email?: string;
};

// Type alias with union
type ID = number | string;

// Complex type with intersection
type Employee = User & {
  department: string;
  salary: number;
};

// Type with literals
type Direction = 'north' | 'south' | 'east' | 'west';

const employee: Employee = {
  id: 123,
  name: 'John Doe',
  department: 'Engineering',
  salary: 75000
};

const userId: ID = 'abc-123'; // Can be string or number`,
        explanation: 'This example showcases type aliases in TypeScript, demonstrating unions, intersections, and literal types.',
        language: 'typescript'
      }
    ],
    relatedQuestions: ['typescript_1', 'typescript_2'],
    relatedTasks: ['task_typescript_interfaces'],
    tags: ['typescript', 'interfaces', 'type aliases', 'type system'],
    technology: 'TypeScript'
  },
  {
    id: 'nextjs_data_fetching',
    title: 'Next.js Data Fetching Methods',
    content: `
# Next.js Data Fetching Methods

Next.js provides several ways to fetch data for your pages, each with different trade-offs in terms of performance, user experience, and developer experience.

## Server-Side Rendering (SSR) with getServerSideProps

Use \`getServerSideProps\` when you need to fetch data on each request. This is useful for pages that display frequently updated data or user-specific content.

## Static Site Generation (SSG) with getStaticProps

Use \`getStaticProps\` when the data required to render the page can be available at build time. This is ideal for marketing pages, blog posts, or product listings that don't change frequently.

## Incremental Static Regeneration (ISR)

ISR allows you to update static pages after they've been built without needing to rebuild the entire site. Specify a \`revalidate\` property in \`getStaticProps\` to use this feature.

## Client-Side Data Fetching

For data that changes frequently or is user-specific, you might want to fetch it directly from the client using SWR or React Query.
    `,
    examples: [
      {
        id: 'getServerSideProps_example',
        title: 'getServerSideProps Example',
        code: `// pages/dashboard.js
export async function getServerSideProps(context) {
  // Fetch data from external API
  const res = await fetch('https://api.example.com/user', {
    headers: {
      'Authorization': \`Bearer \${context.req.cookies.token}\`
    }
  });
  const userData = await res.json();

  // Pass data to the page via props
  return { props: { userData } };
}

export default function Dashboard({ userData }) {
  return (
    <div>
      <h1>Welcome, {userData.name}</h1>
      <p>Your role: {userData.role}</p>
    </div>
  );
}`,
        explanation: 'This example shows how to use getServerSideProps to fetch user-specific data on each request, like for a personalized dashboard.',
        language: 'jsx'
      },
      {
        id: 'getStaticProps_example',
        title: 'getStaticProps with ISR Example',
        code: `// pages/products/[id].js
export async function getStaticPaths() {
  // Fetch list of product IDs
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();
  
  // Generate paths for the most popular products
  const paths = products.slice(0, 10).map(product => ({
    params: { id: product.id.toString() }
  }));
  
  return { 
    paths,
    fallback: 'blocking' // Generate remaining pages on-demand
  };
}

export async function getStaticProps({ params }) {
  // Fetch product data
  const res = await fetch(\`https://api.example.com/products/\${params.id}\`);
  const product = await res.json();
  
  return { 
    props: { product },
    revalidate: 60 // Regenerate page after 60 seconds
  };
}

export default function Product({ product }: { product: { name: string; description: string; price: number } }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <p>Price: $\{product.price}</p>
    </div>
  );
}`,
        explanation: 'This example demonstrates getStaticProps with Incremental Static Regeneration, perfect for product pages that change occasionally.',
        language: 'jsx'
      }
    ],
    relatedQuestions: ['nextjs_1', 'nextjs_2'],
    relatedTasks: ['task_nextjs_data_fetching'],
    tags: ['nextjs', 'data fetching', 'ssr', 'ssg', 'isr'],
    technology: 'Next.js'
  },
  {
    id: 'javascript_array_methods',
    title: 'JavaScript Array Methods Beyond Basics',
    content: `
# JavaScript Array Methods Beyond Basics

JavaScript provides numerous powerful array methods beyond the basics of push, pop, and forEach. These methods enable complex data transformations, filtering, and aggregation with clean, functional code.

## Filtering and Searching

- **filter()** - Creates a new array with elements that pass a test
- **find()** - Returns the first element that passes a test
- **findIndex()** - Returns the index of the first element that passes a test
- **some()** - Tests if at least one element passes a test
- **every()** - Tests if all elements pass a test

## Transforming

- **map()** - Creates a new array by transforming every element
- **flatMap()** - Maps each element, then flattens the result
- **flat()** - Creates a new array with sub-array elements concatenated

## Aggregating

- **reduce()** - Reduces the array to a single value by executing a function
- **reduceRight()** - Like reduce but works right-to-left
    `,
    examples: [
      {
        id: 'array_methods_example',
        title: 'Advanced Array Methods',
        code: `const numbers = [1, 2, 3, 4, 5, 6];

// filter: creates a new array with elements that pass the test
const evens = numbers.filter(num => num % 2 === 0);
console.log(evens); // [2, 4, 6]

// reduce: accumulates values
const sum = numbers.reduce((total, num) => total + num, 0);
console.log(sum); // 21

// some: tests if at least one element passes the test
const hasEven = numbers.some(num => num % 2 === 0);
console.log(hasEven); // true

// every: tests if all elements pass the test
const allPositive = numbers.every(num => num > 0);
console.log(allPositive); // true

// find: returns the first element that passes the test
const firstEven = numbers.find(num => num % 2 === 0);
console.log(firstEven); // 2

// findIndex: returns the index of the first element that passes the test
const firstEvenIndex = numbers.findIndex(num => num % 2 === 0);
console.log(firstEvenIndex); // 1

// flatMap: maps each element and flattens the result
const pairs = numbers.flatMap(num => [num, num * 2]);
console.log(pairs); // [1, 2, 2, 4, 3, 6, 4, 8, 5, 10, 6, 12]`,
        explanation: 'This example demonstrates various advanced array methods in JavaScript, showing their syntax and output.',
        language: 'javascript'
      },
      {
        id: 'array_methods_real_world',
        title: 'Real-world Array Method Examples',
        code: `// Sample data
const users = [
  { id: 1, name: 'Alice', age: 28, active: true },
  { id: 2, name: 'Bob', age: 35, active: false },
  { id: 3, name: 'Charlie', age: 24, active: true },
  { id: 4, name: 'Diana', age: 42, active: true }
];

// Get all active users
const activeUsers = users.filter(user => user.active);

// Check if all users are adults
const allAdults = users.every(user => user.age >= 18);

// Find a user by ID
function findUserById(id) {
  return users.find(user => user.id === id);
}

// Transform users to name-only array
const names = users.map(user => user.name);

// Group users by active status
const groupedByStatus = users.reduce((groups, user) => {
  const key = user.active ? 'active' : 'inactive';
  groups[key] = groups[key] || [];
  groups[key].push(user);
  return groups;
}, {});

// Get total age of all users
const totalAge = users.reduce((sum, user) => sum + user.age, 0);`,
        explanation: 'This example shows practical applications of array methods with a more complex data structure.',
        language: 'javascript'
      }
    ],
    relatedQuestions: ['javascript_arrays_1', 'javascript_arrays_2'],
    relatedTasks: ['task_array_manipulation'],
    tags: ['javascript', 'arrays', 'functional programming'],
    technology: 'JavaScript'
  },
  {
    id: 'react_performance_optimization',
    title: 'React Performance Optimization Techniques',
    content: `
# React Performance Optimization Techniques

Optimizing React applications is crucial for delivering a smooth user experience. Here are several key techniques to improve your React app's performance:

## Component Optimization

1. **React.memo** - Prevents unnecessary re-renders for functional components
2. **PureComponent** - Class component equivalent of React.memo
3. **shouldComponentUpdate** - Fine-grained control over component updates

## Hook Optimization

1. **useMemo** - Memoize expensive calculations
2. **useCallback** - Prevent function recreation on each render
3. **useTransition** - Mark state updates as non-urgent
4. **useDeferredValue** - Defer updating less critical parts of the UI

## Code-Splitting

1. **React.lazy** - Load components only when needed
2. **Suspense** - Show fallback content while components load

## List Optimization

1. **Virtualization** - Render only visible items in long lists
2. **Proper key usage** - Help React identify which items have changed
    `,
    examples: [
      {
        id: 'react_memo_example',
        title: 'React.memo Example',
        code: `import React, { useState } from 'react';

// Expensive component that shouldn't re-render unless props change
const ExpensiveComponent = React.memo(({ data }) => {
  console.log('ExpensiveComponent rendered');
  
  // Imagine this component does something costly with the data
  return (
    <div>
      <h2>Expensive Calculation Result</h2>
      <ul>
        {data.map(item => (
          <li key={item.id}>{item.value}</li>
        ))}
      </ul>
    </div>
  );
});

// Parent component
function App() {
  const [count, setCount] = useState(0);
  const [data] = useState([
    { id: 1, value: 'Item 1' },
    { id: 2, value: 'Item 2' },
    { id: 3, value: 'Item 3' }
  ]);
  
  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      
      {/* ExpensiveComponent won't re-render when count changes */}
      <ExpensiveComponent data={data} />
    </div>
  );
}`,
        explanation: 'This example demonstrates React.memo to prevent unnecessary re-renders of an expensive component when unrelated state changes in the parent.',
        language: 'tsx'
      },
      {
        id: 'useMemo_useCallback_example',
        title: 'useMemo and useCallback Example',
        code: `import React, { useState, useMemo, useCallback } from 'react';

function SearchResults({ items, query, onItemClick }) {
  // Memoize expensive filtering operation
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]); // Only recalculate when items or query changes
  
  // Memoize event handler to prevent recreation
  const handleItemClick = useCallback((item) => {
    console.log('Item clicked:', item);
    onItemClick(item);
  }, [onItemClick]);
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li 
          key={item.id}
          onClick={() => handleItemClick(item)}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}

// Parent component
function App() {
  const [query, setQuery] = useState('');
  const [items] = useState([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
    { id: 4, name: 'Date' },
    { id: 5, name: 'Elderberry' }
  ]);
  
  const handleItemClick = (item) => {
    alert(\`You selected \${item.name}\`);
  };
  
  return (
    <div>
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search fruits..."
      />
      <SearchResults 
        items={items}
        query={query}
        onItemClick={handleItemClick}
      />
    </div>
  );
}`,
        explanation: 'This example shows how to use useMemo to optimize expensive calculations and useCallback to prevent function recreations.',
        language: 'tsx'
      }
    ],
    relatedQuestions: ['react_performance_1', 'react_performance_2'],
    relatedTasks: ['task_optimize_component'],
    tags: ['react', 'performance', 'optimization', 'memoization'],
    technology: 'React'
  }
];
