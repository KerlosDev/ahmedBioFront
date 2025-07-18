// Dynamic sitemap.xml for Next.js App Router
export async function GET() {
  const baseUrl = 'https://www.ahmedbio.com'; // Change to your actual domain

  // Static pages
  const pages = [
    '',
    'book-order',
    'profile',
    'sign-in',
    'sign-up', 
  ];

  // Get course data from API
  let coursesSitemap = '';
  try {
    // Using the same API endpoint as in Courses.jsx
    const courseRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://ahmedbioback.onrender.com'}/course`);

    if (courseRes.ok) {
      const data = await courseRes.json();

      // Filter out draft courses, same as in Courses.jsx
      const courses = (data.courses || []).filter(course => !course.isDraft);

      if (courses && Array.isArray(courses)) {
        // Map each course to a sitemap entry
        const coursesUrls = courses.map(course => {
          const courseId = course._id; // Using _id as in Courses.jsx

          return `  <url>
    <loc>${baseUrl}/Courses/${courseId}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
        }).join('\n');

        coursesSitemap = coursesUrls;
      }
    }
  } catch (error) {
    console.error('Error fetching courses for sitemap:', error);
  }

  // Generate main pages sitemap entries
  const staticUrls = pages.map(
    (page) => `  <url>
    <loc>${baseUrl}/${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('\n');

  // Combine static and dynamic URLs
  const allUrls = `${staticUrls}\n${coursesSitemap}`;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
