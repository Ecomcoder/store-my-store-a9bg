'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || ''

interface Review {
  id: string
  product_id: string
  rating: number
  title: string
  content?: string
  status: string
  created_at: string
}

interface ReviewsResponse {
  reviews: Review[]
  total: number
  averageRating: number
}

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUB_KEY,
  }
  if (STORE_ID) headers['X-Store-Environment-ID'] = STORE_ID
  return headers
}

function useReviews(productId: string, page: number, perPage: number) {
  return useQuery<ReviewsResponse>({
    queryKey: ['reviews', productId, page, perPage],
    queryFn: async () => {
      const offset = (page - 1) * perPage
      const res = await fetch(
        `${BACKEND_URL}/store/reviews?product_id=${productId}&limit=${perPage}&offset=${offset}`,
        { headers: getHeaders() },
      )
      if (!res.ok) throw new Error('Failed to fetch reviews')
      return res.json()
    },
    staleTime: 60_000,
  })
}

function useCreateReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      productId: string
      rating: number
      title: string
      content: string
    }) => {
      const res = await fetch(`${BACKEND_URL}/store/reviews`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: payload.productId,
          rating: payload.rating,
          title: payload.title,
          content: payload.content,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit review')
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
    },
  })
}

interface ReviewsWidgetProps {
  productId: string
}

export function ReviewsWidget({ productId }: ReviewsWidgetProps) {
  const [page, setPage] = useState(1)
  const perPage = 5

  const { data, isLoading } = useReviews(productId, page, perPage)
  const { mutate: createReview, isPending, isSuccess } = useCreateReview()

  const [title, setTitle] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [content, setContent] = useState('')

  const reviews = data?.reviews ?? []
  const total = data?.total ?? 0
  const average = data?.averageRating ?? 0
  const totalPages = Math.ceil(total / perPage)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating || !title) return

    createReview(
      { productId, rating, title, content },
      {
        onSuccess: () => {
          setTitle('')
          setRating(0)
          setContent('')
        },
      },
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      {total > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold">{average}</span>
          <div>
            <StarRow rating={average} />
            <p className="text-sm text-gray-500 mt-0.5">
              {total} review{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Review list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <StarRow rating={review.rating} />
                {review.title && (
                  <span className="text-sm font-medium">{review.title}</span>
                )}
              </div>
              {review.content && (
                <p className="text-sm text-gray-700">{review.content}</p>
              )}
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Submit form */}
      <div className="border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Write a review</h4>

        {isSuccess ? (
          <p className="text-sm text-green-700 bg-green-50 rounded p-3">
            Thanks! Your review is pending approval.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoveredRating(n)}
                    onMouseLeave={() => setHoveredRating(0)}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        n <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Summarise your experience"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Review{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Share your experience..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !rating || !title}
              className="w-full bg-black text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
            >
              {isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${
            n <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  )
}
