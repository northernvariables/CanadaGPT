/**
 * Bookmark Collections API Route
 *
 * GET /api/bookmarks/collections - List user's collections
 * POST /api/bookmarks/collections - Create collection (BASIC+ tier)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createAdminClient } from '@/lib/supabase-server';
import { canCreateCollection, getTierLimits } from '@/lib/bookmarks/tierLimits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookmarks/collections
 * List user's collections with bookmark counts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    const tier = profile?.subscription_tier || 'FREE';
    const tierLimits = getTierLimits(tier);

    // Check if user has access to collections
    if (tierLimits.maxCollections === 0) {
      return NextResponse.json({
        collections: [],
        canCreate: false,
        tier,
        upgradeRequired: true,
      });
    }

    // Fetch collections
    const { data: collections, error } = await supabase
      .from('bookmark_collections')
      .select('*')
      .eq('user_id', session.user.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }

    // Get bookmark count for each collection
    const collectionsWithCounts = await Promise.all(
      (collections || []).map(async (collection: any) => {
        const { count } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('collection_id', collection.id);

        return {
          ...collection,
          bookmarkCount: count || 0,
        };
      })
    );

    const canCreate = canCreateCollection(collections?.length || 0, tier);

    return NextResponse.json({
      collections: collectionsWithCounts,
      canCreate,
      tier,
      limits: tierLimits,
    });
  } catch (error) {
    console.error('Collections API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bookmarks/collections
 * Create collection (BASIC+ tier only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    const {
      name,
      description = '',
      icon = '📁',
      color = '#DC143C',
    } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', session.user.id)
      .single();

    const tier = profile?.subscription_tier || 'FREE';
    const tierLimits = getTierLimits(tier);

    // Check tier permission
    if (tierLimits.maxCollections === 0) {
      return NextResponse.json(
        {
          error: 'Collections not available on FREE tier',
          tier,
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Check collection limit
    const { count: currentCount } = await supabase
      .from('bookmark_collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (!canCreateCollection(currentCount || 0, tier)) {
      return NextResponse.json(
        {
          error: 'Collection limit reached',
          tier,
          currentCount,
          limit: tierLimits.maxCollections,
          upgradeRequired: tier !== 'PRO',
        },
        { status: 403 }
      );
    }

    // Get next display_order
    const { data: maxOrderCollection } = await supabase
      .from('bookmark_collections')
      .select('display_order')
      .eq('user_id', session.user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = (maxOrderCollection?.display_order || 0) + 1;

    // Create collection
    const { data: collection, error: createError } = await supabase
      .from('bookmark_collections')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        display_order: displayOrder,
        is_ai_suggested: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating collection:', createError);

      // Check for unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A collection with this name already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      collection: {
        ...collection,
        bookmarkCount: 0,
      },
    });
  } catch (error) {
    console.error('Collections API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
