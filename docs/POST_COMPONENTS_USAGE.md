/**
 * PostCard and PostList Components Usage Examples
 *
 * These components provide flexible, reusable post display functionality
 * with support for both card and list layouts.
 *
 * Example 1: Basic List View
 * --------------------------
 * ```tsx
 * import { PostList } from '@/components/posts';
 *
 * <PostList
 *   posts={posts}
 *   boardKey="general"
 *   view="list"
 *   currentPage={1}
 *   pageSize={20}
 *   total={150}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 * ```
 *
 * Example 2: Card Grid View with Thumbnails
 * -----------------------------------------
 * ```tsx
 * import { PostList } from '@/components/posts';
 *
 * <PostList
 *   posts={posts}
 *   boardKey="gallery"
 *   view="card"
 *   showThumbnails={true}
 *   showCategories={true}
 *   showNumbers={false}
 *   pageSize={12}
 *   onPageChange={(page) => setCurrentPage(page)}
 * />
 * ```
 *
 * Example 3: Loading State
 * ------------------------
 * ```tsx
 * <PostList
 *   posts={[]}
 *   boardKey="general"
 *   isLoading={true}
 *   pageSize={10}
 * />
 * ```
 *
 * Example 4: Custom Empty Message
 * -------------------------------
 * ```tsx
 * <PostList
 *   posts={[]}
 *   boardKey="general"
 *   emptyMessage="검색 결과가 없습니다."
 * />
 * ```
 *
 * Example 5: Using PostCard Directly
 * ----------------------------------
 * ```tsx
 * import { PostCard } from '@/components/posts';
 *
 * <div className="space-y-2">
 *   {posts.map((post) => (
 *     <PostCard
 *       key={post.id}
 *       post={post}
 *       boardKey="general"
 *       layout="list"
 *       showCategory={true}
 *       showThumbnail={true}
 *     />
 *   ))}
 * </div>
 * ```
 *
 * Example 6: Toggle View (Grid/List)
 * ---------------------------------
 * ```tsx
 * 'use client';
 * import { useState } from 'react';
 * import { PostList } from '@/components/posts';
 *
 * export function PostView({ posts, boardKey }: { posts: Post[], boardKey: string }) {
 *   const [view, setView] = useState<'card' | 'list'>('list');
 *
 *   return (
 *     <div>
 *       {/* View Toggle */}
 *       <div className="flex gap-2 mb-4">
 *         <button
 *           onClick={() => setView('list')}
 *           className={`px-4 py-2 rounded-lg ${
 *             view === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600'
 *           }`}
 *         >
 *           목록
 *         </button>
 *         <button
 *           onClick={() => setView('card')}
 *           className={`px-4 py-2 rounded-lg ${
 *             view === 'card' ? 'bg-primary-600 text-white' : 'bg-white text-slate-600'
 *           }`}
 *         >
 *           카드
 *         </button>
 *       </div>
 *
 *       {/* Post List */}
 *       <PostList
 *         posts={posts}
 *         boardKey={boardKey}
 *         view={view}
 *         showThumbnails={view === 'card'}
 *         onPageChange={(page) => console.log(page)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * Component Props Reference
 * -------------------------
 *
 * PostCardProps:
 *   - post: Post object with all required fields
 *   - boardKey: string - board identifier for routing
 *   - layout?: 'card' | 'list' (default: 'list')
 *   - showNumber?: boolean (default: true)
 *   - number?: number - explicit post number
 *   - showThumbnail?: boolean (default: false)
 *   - showCategory?: boolean (default: false)
 *   - className?: string - additional CSS classes
 *
 * PostListProps:
 *   - posts: Post[] - array of post objects
 *   - boardKey: string - board identifier for routing
 *   - view?: 'card' | 'list' (default: 'list')
 *   - currentPage?: number (default: 1)
 *   - pageSize?: number (default: 20)
 *   - total?: number - total posts (for pagination)
 *   - onPageChange?: (page: number) => void
 *   - showNumbers?: boolean (default: true)
 *   - showThumbnails?: boolean (default: false)
 *   - showCategories?: boolean (default: false)
 *   - isLoading?: boolean (default: false)
 *   - emptyMessage?: string (default: '게시글이 없습니다.')
 *   - children?: React.ReactNode - custom content
 *   - className?: string - additional CSS classes
 *
 * Post Interface:
 *   - id: number
 *   - title: string
 *   - content: string
 *   - authorName: string | null
 *   - nickname?: string | null
 *   - createdAt: string
 *   - viewCount: number
 *   - likeCount: number
 *   - commentCount: number
 *   - isNotice: boolean
 *   - isPinned: boolean
 *   - isSecret: boolean
 *   - category: string | null
 *   - thumbnail?: string | null
 */
