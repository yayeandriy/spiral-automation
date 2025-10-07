// n8n JavaScript Code Node: Convert Notion collection blocks into clean HTML
// This script takes Notion database/collection items and renders a minimal HTML snippet
// without inline styles, CSS classes, scripts, or HTML headers.

const inputItems = $input.all().map(item => item.json);

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function flattenEntries(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.results)) {
    return data.results;
  }

  if (data.object === 'list' && Array.isArray(data.items)) {
    return data.items;
  }

  return [data];
}

function extractTitle(entry) {
  if (!entry) {
    return '';
  }

  if (entry.property_name) {
    return entry.property_name;
  }

  if (typeof entry.name === 'string') {
    return entry.name;
  }

  if (Array.isArray(entry.title)) {
    return entry.title.map(part => part.plain_text || part.text?.content || '').join('').trim();
  }

  if (entry.properties) {
    const titleProperty = Object.values(entry.properties).find(prop => prop?.type === 'title');
    if (titleProperty) {
      const fragments = titleProperty.title || titleProperty.rich_text || [];
      return fragments
        .map(fragment => fragment.plain_text || fragment.text?.content || '')
        .join('')
        .trim();
    }
  }

  return '';
}

function extractUrl(entry) {
  if (!entry) {
    return '';
  }

  if (typeof entry.url === 'string') {
    return entry.url;
  }

  if (entry.properties) {
    const urlProperty = Object.values(entry.properties).find(prop => prop?.type === 'url');
    if (urlProperty?.url) {
      return urlProperty.url;
    }
  }

  if (entry.public_url) {
    return entry.public_url;
  }

  return '';
}

function pickDateValue(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value.start) {
    return value.start;
  }

  if (value.date) {
    return pickDateValue(value.date);
  }

  if (value.value) {
    return pickDateValue(value.value);
  }

  return '';
}

function extractDate(entry) {
  const directCandidates = [
    entry?.property_publish_date,
    entry?.publish_date,
    entry?.date
  ];

  for (const candidate of directCandidates) {
    const picked = pickDateValue(candidate);
    if (picked) {
      return picked;
    }
  }

  if (entry?.properties) {
    const explicitKeys = ['publish_date', 'PublishDate', 'Publish date', 'published', 'Date'];
    for (const key of explicitKeys) {
      const property = entry.properties[key];
      const picked = pickDateValue(property?.date || property);
      if (picked) {
        return picked;
      }
    }

    const dateProperty = Object.values(entry.properties).find(prop => prop?.type === 'date');
    if (dateProperty) {
      const picked = pickDateValue(dateProperty);
      if (picked) {
        return picked;
      }
    }
  }

  return entry?.created_time || entry?.last_edited_time || '';
}

function normalizeAuthorLabel(value) {
  if (!value) {
    return '';
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.includes('@')) {
    return trimmed;
  }

  const namePart = trimmed.split('@')[0];
  if (!namePart) {
    return trimmed;
  }

  const spaced = namePart.replace(/[-_.]+/g, ' ');
  return spaced.replace(/\b\w/g, char => char.toUpperCase()).trim() || trimmed;
}

function extractAuthors(entry) {
  const authors = new Set();

  const raw = entry?.property_author || entry?.author;
  if (Array.isArray(raw)) {
    raw.forEach(value => {
      if (typeof value === 'string') {
        const formatted = normalizeAuthorLabel(value);
        if (formatted) {
          authors.add(formatted);
        }
      } else if (value) {
        const candidate = value.name || value.plain_text || normalizeAuthorLabel(value.email);
        if (candidate) {
          authors.add(candidate);
        }
      }
    });
  } else if (typeof raw === 'string') {
    raw.split(/,|;/).forEach(part => {
      const formatted = normalizeAuthorLabel(part);
      if (formatted) {
        authors.add(formatted);
      }
    });
  } else if (raw?.people && Array.isArray(raw.people)) {
    raw.people.forEach(person => {
      const candidate = person?.name || normalizeAuthorLabel(person?.person?.email || person?.email);
      if (candidate) {
        authors.add(candidate);
      }
    });
  }

  if (entry?.properties) {
    const peopleProperty = entry.properties.author
      || entry.properties.Author
      || Object.values(entry.properties).find(prop => prop?.type === 'people');

    if (peopleProperty?.people && Array.isArray(peopleProperty.people)) {
      peopleProperty.people.forEach(person => {
        const candidate = person?.name || normalizeAuthorLabel(person?.person?.email || person?.email);
        if (candidate) {
          authors.add(candidate);
        }
      });
    }
  }

  return Array.from(authors);
}

function extractSummary(entry) {
  const directSummary = entry?.property_summary || entry?.summary || entry?.excerpt;
  if (typeof directSummary === 'string' && directSummary.trim()) {
    return directSummary.trim();
  }

  if (entry?.properties) {
    const textProperty = Object.values(entry.properties).find(prop => {
      return prop?.type === 'rich_text' || prop?.type === 'text';
    });

    if (textProperty) {
      const fragments = textProperty.rich_text || textProperty.text || [];
      const combined = fragments
        .map(fragment => fragment.plain_text || fragment.text?.content || '')
        .join(' ')
        .trim();
      if (combined) {
        return combined;
      }
    }
  }

  return '';
}

function extractTags(entry) {
  const raw = entry?.property_tags || entry?.tags;
  if (Array.isArray(raw)) {
    return raw.map(tag => {
      if (typeof tag === 'string') {
        return tag;
      }
      return tag?.name || '';
    }).filter(Boolean);
  }

  if (entry?.properties) {
    const multiSelect = Object.values(entry.properties).find(prop => prop?.type === 'multi_select');
    if (multiSelect?.multi_select) {
      return multiSelect.multi_select.map(option => option?.name || '').filter(Boolean);
    }
  }

  return [];
}

function extractSlug(entry) {
  const direct = entry?.property_tag || entry?.slug || entry?.identifier;
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  if (entry?.properties) {
    const slugProperty = entry.properties.property_tag
      || entry.properties.tag
      || entry.properties.Tag
      || Object.values(entry.properties).find(prop => prop?.name === 'Tag' || prop?.name === 'Slug');

    if (slugProperty?.type === 'rich_text' || slugProperty?.type === 'title') {
      const segments = slugProperty.rich_text || slugProperty.title || [];
      const combined = segments
        .map(segment => segment.plain_text || segment.text?.content || '')
        .join('')
        .trim();
      if (combined) {
        return combined;
      }
    }

    if (slugProperty?.type === 'formula' && slugProperty.formula?.string) {
      return slugProperty.formula.string.trim();
    }

    if (slugProperty?.type === 'rich_text' && slugProperty.rich_text?.length === 0 && slugProperty.id) {
      const fallback = entry.properties[slugProperty.id];
      if (fallback?.type === 'rich_text') {
        const combined = fallback.rich_text
          .map(segment => segment.plain_text || segment.text?.content || '')
          .join('')
          .trim();
        if (combined) {
          return combined;
        }
      }
    }
  }

  return '';
}

function formatDateLabel(dateString) {
  if (!dateString) {
    return { label: '', iso: '' };
  }

  const isoPart = dateString.split('T')[0];
  const [year, month, day] = isoPart.split('-').map(part => parseInt(part, 10));

  if (!year || !month || !day) {
    return { label: dateString, iso: isoPart || dateString };
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = months[month - 1];
  if (!monthName) {
    return { label: isoPart, iso: isoPart };
  }

  return {
    label: `${monthName} ${day}, ${year}`,
    iso: isoPart
  };
}

const rawEntries = inputItems.flatMap(flattenEntries);
const entries = rawEntries.filter(entry => entry && entry.type !== 'child_database');

const processedEntries = entries
  .map(entry => {
    const rawDate = extractDate(entry);
    const fallback = entry?.created_time || entry?.last_edited_time || '';
    const timestampSource = rawDate || fallback;
    const parsedTimestamp = Date.parse(timestampSource);

    return {
      entry,
      rawDate,
      timestamp: Number.isFinite(parsedTimestamp) ? parsedTimestamp : Number.NEGATIVE_INFINITY
    };
  })
  .sort((a, b) => {
    if (a.timestamp === b.timestamp) {
      const aTitle = extractTitle(a.entry);
      const bTitle = extractTitle(b.entry);
      return aTitle.localeCompare(bTitle);
    }
    return b.timestamp - a.timestamp;
  });

const articles = processedEntries
  .map(({ entry, rawDate }) => {
    const title = extractTitle(entry);
    const slug = extractSlug(entry);
    const dateInfo = formatDateLabel(rawDate);
    const authors = extractAuthors(entry);
    const summary = extractSummary(entry);
    const tags = extractTags(entry);

    if (!title || !slug) {
      return '';
    }

    const lines = [];
    lines.push('  <article>');
    const articleHref = `/blog-post/${slug}`;
    const wrapperStart = `    <a href="${escapeHtml(articleHref)}">`;
    const wrapperEnd = '    </a>';
    lines.push(wrapperStart);

    if (dateInfo.label) {
      lines.push(`      <time datetime="${escapeHtml(dateInfo.iso)}">${escapeHtml(dateInfo.label)}</time>`);
    }

    lines.push(`      <h3>${escapeHtml(title)}</h3>`);

    if (authors.length > 0) {
      const authorLabel = authors.length > 1 ? 'Authors' : 'Author';
      lines.push(`      <p>${escapeHtml(authors.join(', '))}</p>`);
    }

    lines.push(wrapperEnd);
    lines.push('  </article>');
    return lines.join('\n');
  })
  .filter(Boolean);

let htmlOutput = '';

if (articles.length > 0) {
  htmlOutput = `<section class="collection-section" >\n${articles.join('\n')}\n</section>`;
}

return [
  {
    json: {
      items_count: entries.length,
      html: htmlOutput
    }
  }
];
