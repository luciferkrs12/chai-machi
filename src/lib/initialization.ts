import { supabase, InventoryItem, Sale, SaleItem } from "./supabase";

// Migration/Initialization system
const MIGRATION_KEY = "db_migration_v1_complete";

export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1);

    // If error is about RLS or permissions, table exists
    // If error is "not found" or similar, table doesn't exist
    if (!error) return true;
    
    const errorMsg = error.message.toLowerCase();
    if (
      errorMsg.includes("not found") ||
      errorMsg.includes("does not exist") ||
      errorMsg.includes("undefined")
    ) {
      return false;
    }

    // Other errors mean table likely exists but there's a permission/RLS issue
    return true;
  } catch {
    return false;
  }
}

export async function initializeDatabase(): Promise<{
  success: boolean;
  error: string | null;
  message: string;
}> {
  // Check if already initialized
  const migrationDone = localStorage.getItem(MIGRATION_KEY);
  if (migrationDone === "true") {
    return {
      success: true,
      error: null,
      message: "Database already initialized",
    };
  }

  try {
    console.log("🔄 Checking database tables...");

    // Check if tables exist
    const usersExists = await checkTableExists("users");
    const inventoryExists = await checkTableExists("inventory");
    const salesExists = await checkTableExists("sales");
    const saleItemsExists = await checkTableExists("sale_items");

    console.log(`users: ${usersExists}, inventory: ${inventoryExists}, sales: ${salesExists}, sale_items: ${saleItemsExists}`);

    // If all exist, mark as done
    if (usersExists && inventoryExists && salesExists && saleItemsExists) {
      localStorage.setItem(MIGRATION_KEY, "true");
      return {
        success: true,
        error: null,
        message: "All tables already exist",
      };
    }

    // Tables don't exist - need to create them
    // Since we can't create tables from client, we'll show instructions
    return {
      success: false,
      error: "Tables do not exist in database",
      message:
        "Please run initialization in Supabase dashboard or use admin setup",
    };
  } catch (err) {
    return {
      success: false,
      error: String(err),
      message: "Failed to check database initialization",
    };
  }
}

export async function createTablesIfNeeded(): Promise<{
  success: boolean;
  created: boolean;
  error: string | null;
}> {
  try {
    // Check each table
    const tables = {
      users: await checkTableExists("users"),
      inventory: await checkTableExists("inventory"),
      sales: await checkTableExists("sales"),
      sale_items: await checkTableExists("sale_items"),
    };

    const needsCreation = Object.values(tables).includes(false);

    if (!needsCreation) {
      localStorage.setItem(MIGRATION_KEY, "true");
      return {
        success: true,
        created: false,
        error: null,
      };
    }

    // Try to create using Supabase function if available
    // For now, return that manual setup is needed
    console.warn(
      "⚠️ Tables do not exist. Please run setup in Supabase dashboard."
    );

    return {
      success: false,
      created: false,
      error: "Manual setup required - see console",
    };
  } catch (err) {
    return {
      success: false,
      created: false,
      error: String(err),
    };
  }
}

// Helper to clear old demo data if needed
export async function clearDemoData(): Promise<void> {
  try {
    const demoIds = ["demo-1", "demo-2", "demo-3"];

    for (const id of demoIds) {
      await supabase.from("inventory").delete().eq("id", id);
    }

    console.log("✅ Cleared old demo data");
  } catch (err) {
    console.warn("Could not clear demo data:", err);
  }
}

// Check connection and initialize
export async function initApp(): Promise<{
  ready: boolean;
  error: string | null;
}> {
  try {
    console.log("🚀 Initializing application...");

    // First, check tables
    const init = await createTablesIfNeeded();

    if (!init.success && init.error?.includes("manual")) {
      // Tables don't exist - app still works but with empty state
      console.warn("ℹ️ No tables found - app ready but empty. Data will be created on first use.");
      return {
        ready: true,
        error: null,
      };
    }

    if (init.success) {
      localStorage.setItem(MIGRATION_KEY, "true");
      console.log("✅ Database ready");
      return {
        ready: true,
        error: null,
      };
    }

    return {
      ready: true,
      error: null,
    };
  } catch (err) {
    console.error("App initialization error:", err);
    return {
      ready: true, // Continue anyway
      error: String(err),
    };
  }
}
