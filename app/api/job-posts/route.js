import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/server';
import { generateSlug } from '../../../lib/utils/slug';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('job_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (brand) {
      query = query.eq('brand', brand);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch job posts: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Get job posts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, brand, department, location, employmentType, salaryRangeMin, salaryRangeMax, description, requirements, status, userId, userEmail } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Generate unique slug
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let suffix = 1;
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from('job_posts')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const { data, error } = await supabaseAdmin
      .from('job_posts')
      .insert([{
        title,
        slug,
        brand: brand || 'venzo',
        department: department || null,
        location: location || null,
        employment_type: employmentType || 'full-time',
        salary_range_min: salaryRangeMin || null,
        salary_range_max: salaryRangeMax || null,
        description,
        requirements: requirements || null,
        status: status || 'OPEN',
        created_by: userId,
        created_by_email: userEmail || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Job post insert error:', error);
      return NextResponse.json(
        { error: `Failed to create job post: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Create job post error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
