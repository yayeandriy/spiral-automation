// eslint-disable-next-line unused-imports/no-unused-vars
const RSS_FEED = "https://developers.notion.com/changelog.rss"
const ERROR_MESSAGE = "Sorry, we could not get the changelog right now."

const formatDate = timestamp => {
	const date = new Date(timestamp)
	const year = date.getFullYear()
	// Format month as double digits i.e. 02 for February or 11 for November
	const month =
		date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1
	// Format numerical day of the month as double digits i.e. 05 for the 5th day of the month or 15th which is pay day
	const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()

	return `${year}-${month}-${day}`
}

const formatElement = element => `
		<section class="rendered-entry  change-log__entry">
			<p class="copy copy--mono change-log__entry-date">
					${formatDate(element.querySelector("pubDate").innerHTML)}
			</p>
			<p class="rendered-entry copy copy--body-m change-log__entry-text"><a href="${
				element.querySelector("link").innerHTML
			}">${element
	.querySelector("title")
	.innerHTML.trim()
	.replace(/^(\/\/\s*)?<!\[CDATA\[|(\/\/\s*)?\]\]>$/g, "")}</a></p>
		</section>
	`

// eslint-disable-next-line unused-imports/no-unused-vars
const getRSSFeedResults = (url, target) =>
	fetch(url)
		.then(response => response.text())
		.then(responseText =>
			// Parse received XML
			new window.DOMParser().parseFromString(responseText, "text/xml")
		)
		.then(data => {
			// Begin to segment XML results
			const items = data.querySelectorAll("item")
			const html = []

			items.forEach(element => {
				// HTML template for each post
				const content = formatElement(element)
				// Format whitespace on HTML template
				html.push(content.trim())
			})
			// Limit return to the 5 latest entries. Everything after can be removed
			html.splice(5, html.length - 5)
			return html.join("")
		})
		.then(html => (target.innerHTML = html))
		.catch(error => {
			target.innerHTML = `<section class="change-log__entry"><p class="copy copy--body-m">${ERROR_MESSAGE}</p></section>`
		})
