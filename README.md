# MAV Collectibles

A Next.js e-commerce application for trading card games like Pokémon, Yu-Gi-Oh!, Dragon Ball, and more.

## Project Structure

```
mav-i/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication routes grouped
│   │   ├── login/          # Login page
│   │   ├── signup/         # Signup page
│   │   └── [...]/          # Other auth routes
│   ├── (shop)/             # Shop-related pages grouped
│   │   ├── cart/           # Shopping cart
│   │   ├── products/       # Products pages
│   │   └── [...]/          # Other shop routes
│   ├── admin/              # Admin dashboard and features
│   ├── api/                # API routes
│   │   ├── alerts/         # Alert API endpoints
│   │   ├── auth/           # Auth API endpoints
│   │   ├── feature-flags/  # Feature flags endpoints
│   │   ├── products/       # Products API endpoints
│   │   └── [...]/          # Other API routes
│   └── [...]/              # Other page routes
├── components/             # React components
│   ├── cards/              # Card-specific components
│   ├── forms/              # Form-related components
│   ├── layout/             # Layout components
│   │   ├── footer/         # Footer components
│   │   ├── header/         # Header components
│   │   └── [...]/          # Other layout components
│   ├── media/              # Media-related components
│   │   ├── carousel/       # Carousel components
│   │   ├── video/          # Video player components
│   │   └── [...]/          # Other media components
│   ├── product/            # Product-related components
│   ├── ui/                 # UI components (buttons, inputs, etc.)
│   └── [...]/              # Other component categories
├── config/                 # Application configuration
├── context/                # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Library code and utilities
│   ├── api/                # API client functions
│   ├── db/                 # Database utilities
│   ├── validations/        # Validation schemas
│   └── [...]/              # Other utilities
├── prisma/                 # Prisma ORM configuration
├── public/                 # Static files
│   ├── images/             # Image assets
│   ├── fonts/              # Font files
│   └── [...]/              # Other public assets
├── styles/                 # CSS and styling files
└── types/                  # TypeScript type definitions
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables: Copy `.env.example` to `.env.local`
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Trading card inventory management
- User authentication
- Shopping cart
- Admin dashboard
- Feature flags for controlled feature rollout
- Video content integration

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
