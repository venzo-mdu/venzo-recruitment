import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Support lookup by UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const column = isUuid ? 'id' : 'slug';

    const { data, error } = await supabaseAdmin
      .from('job_posts')
      .select('*')
      .eq(column, id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch job post: ${error.message}` },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Get job post error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, brand, department, location, employmentType, salaryRangeMin, salaryRangeMax, description, requirements, status } = body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (brand !== undefined) updateData.brand = brand;
    if (department !== undefined) updateData.department = department || null;
    if (location !== undefined) updateData.location = location || null;
    if (employmentType !== undefined) updateData.employment_type = employmentType;
    if (salaryRangeMin !== undefined) updateData.salary_range_min = salaryRangeMin || null;
    if (salaryRangeMax !== undefined) updateData.salary_range_max = salaryRangeMax || null;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements || null;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabaseAdmin
      .from('job_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update job post: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error('Update job post error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const { error } = await supabaseAdmin
      .from('job_posts')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: `Failed to delete job post: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete job post error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
