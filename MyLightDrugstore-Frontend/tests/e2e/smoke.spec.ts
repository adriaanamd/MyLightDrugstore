import { expect, test, type Page } from "@playwright/test"

type Credentials = {
  username: string
  password: string
}

type SmokeConfig = {
  baseUrl: string
  staff: Credentials
  admin: Credentials
  medicineId: string
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Missing ${name}. Set the smoke-test environment before running pnpm run test:smoke.`,
    )
  }

  return value
}

function readSmokeConfig(): SmokeConfig {
  return {
    baseUrl: requiredEnvironment("FRONTEND_SMOKE_URL").replace(/\/$/, ""),
    staff: {
      username: requiredEnvironment("SMOKE_STAFF_USERNAME"),
      password: requiredEnvironment("SMOKE_STAFF_PASSWORD"),
    },
    admin: {
      username: requiredEnvironment("SMOKE_ADMIN_USERNAME"),
      password: requiredEnvironment("SMOKE_ADMIN_PASSWORD"),
    },
    medicineId: requiredEnvironment("SMOKE_MEDICINE_ID"),
  }
}

const smoke = readSmokeConfig()

function route(path: string): string {
  return `${smoke.baseUrl}${path}`
}

async function signIn(page: Page, credentials: Credentials): Promise<void> {
  await page.goto(route("/login"), { waitUntil: "domcontentloaded" })
  await page.getByLabel("Username").fill(credentials.username)
  await page.getByLabel("Password").fill(credentials.password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

test("frontend authenticated workflow smoke", async ({ browser }) => {
  const staffContext = await browser.newContext()
  const staffPage = await staffContext.newPage()

  try {
    await staffPage.goto(route("/dashboard"), {
      waitUntil: "domcontentloaded",
    })
    await expect(staffPage).toHaveURL(/\/login$/)

    await signIn(staffPage, smoke.staff)
    await expect(
      staffPage.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible()

    await staffPage.goto(route("/medicines"), {
      waitUntil: "domcontentloaded",
    })
    await expect(
      staffPage.getByRole("heading", { name: "Medicine Catalog" }),
    ).toBeVisible()

    await staffPage.goto(route("/inventory"), {
      waitUntil: "domcontentloaded",
    })
    await expect(
      staffPage.getByRole("heading", { name: "Stock Overview" }),
    ).toBeVisible()

    await staffPage.goto(route("/sales/new"), {
      waitUntil: "domcontentloaded",
    })
    await staffPage.getByPlaceholder(/Enter item code/).fill(smoke.medicineId)
    await staffPage.getByRole("button", { name: "Lookup" }).click()
    await expect(staffPage.getByText("Selected Medicine")).toBeVisible()
    await staffPage.getByRole("button", { name: "Add to Cart" }).click()
    await expect(staffPage).toHaveURL(/\/sales\/cart$/)

    await staffPage.goto(route("/admin/users"), {
      waitUntil: "domcontentloaded",
    })
    await expect(staffPage).toHaveURL(/\/dashboard$/)
  } finally {
    await staffContext.close()
  }

  const failureContext = await browser.newContext()
  const failurePage = await failureContext.newPage()

  try {
    await failurePage.route("**/transport/public-key", async (routeRequest) => {
      await routeRequest.abort("failed")
    })
    await failurePage.goto(route("/login"), { waitUntil: "domcontentloaded" })
    await failurePage.getByLabel("Username").fill(smoke.staff.username)
    await failurePage.getByLabel("Password").fill(smoke.staff.password)
    await failurePage.getByRole("button", { name: "Sign In" }).click()
    await expect(failurePage.locator(".bg-red-50")).toBeVisible()
  } finally {
    await failureContext.close()
  }

  const adminContext = await browser.newContext()
  const adminPage = await adminContext.newPage()

  try {
    await signIn(adminPage, smoke.admin)
    await adminPage.goto(route("/backups"), {
      waitUntil: "domcontentloaded",
    })
    await expect(
      adminPage.getByRole("heading", { name: "Backup Jobs" }),
    ).toBeVisible()
    await adminPage
      .getByRole("button", { name: "Request Backup" })
      .first()
      .click()
    await adminPage
      .getByRole("button", { name: "Request Backup" })
      .last()
      .click()
    await expect(adminPage.getByText(/Backup job .* queued/)).toBeVisible()
    await expect(
      adminPage.getByRole("button", { name: /Download/ }),
    ).toBeVisible({
      timeout: 45_000,
    })
  } finally {
    await adminContext.close()
  }
})
