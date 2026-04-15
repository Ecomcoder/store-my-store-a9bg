## Installed Modules

### Product Reviews
npm: @amboras-test-az/reviews

Let customers rate and review products. Includes star ratings, written reviews, and admin moderation.

**Components (scaffold these in your project — you can edit them freely):**

`ReviewsWidget` — Full review display + submission form for a product page
  Destination: `components/modules/reviews/ReviewsWidget.tsx`
  Usage:       `<ReviewsWidget productId={product.id} />`
  Props:       productId: string (required)

`StarRating` — Read-only star rating display (1–5)
  Destination: `components/modules/reviews/StarRating.tsx`
  Usage:       `<StarRating rating={4} size="sm" />`
  Props:       rating: number (required), size: "sm" | "md" | "lg" (default: "md")

`ReviewForm` — Standalone review submission form
  Destination: `components/modules/reviews/ReviewForm.tsx`
  Usage:       `<ReviewForm productId={product.id} onSuccess={() => setSubmitted(true)} />`
  Props:       productId: string (required), onSuccess: () => void (optional)

**Hooks (from npm package — import, do not copy):**

`useReviews` — `useReviews(productId: string, options?: UseReviewsOptions)`
  Returns: { reviews, count, isLoading, error }
  Import:  `import { useReviews } from '@amboras-test-az/reviews'`

`useCreateReview` — `useCreateReview(options?: UseCreateReviewOptions)`
  Returns: { mutate, isPending, isSuccess, error }
  Import:  `import { useCreateReview } from '@amboras-test-az/reviews'`

**API endpoints:**
  GET /store/reviews?product_id=:id&limit=20&offset=0
  POST /store/reviews
  GET /admin/reviews?status=pending&limit=20&offset=0  ← admin auth required
  PATCH /admin/reviews/:id  ← admin auth required
