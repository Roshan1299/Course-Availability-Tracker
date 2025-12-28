from playwright.async_api import Page

async def fetch_seat_value(
    page: Page,
    url: str,
    course_code: str,
    section_label: str,
) -> str | None:
    await page.goto(url, wait_until="domcontentloaded")
    await page.wait_for_timeout(1500)
    await page.wait_for_selector(".course_box", timeout=20000)

    return await page.evaluate(
        """([courseCode, sectionLabel]) => {
            const boxes = document.querySelectorAll(".course_box");
            for (const box of boxes) {
                const title = box.querySelector(".course_title");
                if (!title || !title.textContent.includes(courseCode)) continue;

                const blocks = box.querySelectorAll("strong.type_block");
                for (const b of blocks) {
                    if (!b.textContent.includes(sectionLabel)) continue;

                    const td = b.closest("td");
                    if (!td) return null;

                    const seat = td.querySelector(".seatText");
                    return seat ? seat.textContent.trim() : null;
                }
            }
            return null;
        }""",
        [course_code, section_label],
    )
