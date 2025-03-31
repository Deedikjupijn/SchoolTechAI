import { 
  type DeviceCategory, type InsertDeviceCategory,
  type Device, type InsertDevice,
  type ChatMessage, type InsertChatMessage,
  type User, type InsertUser
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // Device Categories
  getAllDeviceCategories(): Promise<DeviceCategory[]>;
  getDeviceCategory(id: number): Promise<DeviceCategory | undefined>;
  createDeviceCategory(category: InsertDeviceCategory): Promise<DeviceCategory>;
  
  // Devices
  getAllDevices(): Promise<Device[]>;
  getDevicesByCategory(categoryId: number): Promise<Device[]>;
  getDevice(id: number): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: number, device: Partial<InsertDevice>): Promise<Device | undefined>;
  deleteDevice(id: number): Promise<boolean>;
  
  // Chat Messages
  getChatMessages(deviceId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(deviceId: number): Promise<void>;
  
  // Users
  getAllUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session store for authentication
  sessionStore: any; // Will be properly typed once we implement it
}

export class MemStorage implements IStorage {
  private deviceCategories: Map<number, DeviceCategory>;
  private devices: Map<number, Device>;
  private chatMessages: Map<number, ChatMessage>;
  private users: Map<number, User>;
  
  private categoryId: number;
  private deviceId: number;
  private messageId: number;
  private userId: number;
  
  // Session store for express-session
  sessionStore: session.Store;

  constructor() {
    this.deviceCategories = new Map();
    this.devices = new Map();
    this.chatMessages = new Map();
    this.users = new Map();
    
    this.categoryId = 1;
    this.deviceId = 1;
    this.messageId = 1;
    this.userId = 1;
    
    // Initialize the session store
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  // User management methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username === username
    );
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const timestamp = new Date();
    // Explicitly construct the User object to match the schema
    const newUser: User = { 
      id,
      username: userData.username,
      password: userData.password,
      displayName: userData.displayName,
      isAdmin: userData.isAdmin ?? false, // Ensure isAdmin is always a boolean 
      createdAt: timestamp
    };
    
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Device management methods
  async updateDevice(id: number, deviceData: Partial<InsertDevice>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...deviceData };
    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }
  
  async deleteDevice(id: number): Promise<boolean> {
    return this.devices.delete(id);
  }
  
  private async initializeSampleData() {
    // Create a default admin user with known credentials
    await this.createUser({
      username: "admin",
      password: await hashPassword("M3t@lW0rks2024!Secure#Admin"),
      displayName: "Workshop Administrator",
      isAdmin: true
    });
    
    // Create device categories
    const cuttingCategory = await this.createDeviceCategory({
      name: "Cutting Tools",
      icon: "content_cut"
    });
    
    const drillingCategory = await this.createDeviceCategory({
      name: "Drilling Tools",
      icon: "construction"
    });
    
    const weldingCategory = await this.createDeviceCategory({
      name: "Welding Equipment",
      icon: "local_fire_department"
    });
    
    const measuringCategory = await this.createDeviceCategory({
      name: "Measuring Tools",
      icon: "straighten"
    });
    
    const finishingCategory = await this.createDeviceCategory({
      name: "Finishing Tools",
      icon: "format_paint"
    });
    
    const formingCategory = await this.createDeviceCategory({
      name: "Forming Tools",
      icon: "roundabout_right"
    });
    
    const machiningCategory = await this.createDeviceCategory({
      name: "Machining Tools",
      icon: "settings"
    });
    
    // Create devices
    // 1. Laser Cutter
    await this.createDevice({
      name: "Laser Cutter",
      icon: "laser",
      shortDescription: "Precision cutting tool for metal sheets using focused laser beams",
      categoryId: cuttingCategory.id,
      specifications: {
        "Power": "400W",
        "Cutting Area": "1200mm x 900mm",
        "Precision": "±0.1mm",
        "Max Cutting Thickness": "10mm (steel)",
        "Wavelength": "1064nm"
      },
      materials: {
        "Mild Steel": "Up to 10mm",
        "Stainless Steel": "Up to 8mm",
        "Aluminum": "Up to 6mm",
        "Copper": "Up to 3mm",
        "Brass": "Up to 3mm"
      },
      safetyRequirements: [
        "Always wear laser safety goggles when operating",
        "Never leave the machine unattended during operation",
        "Ensure proper ventilation for fume extraction",
        "Keep flammable materials away from cutting area",
        "Inspect machine for damage before each use",
        "Use only approved materials for cutting"
      ],
      usageInstructions: [
        {
          title: "Prepare Your Design",
          description: "Create or import your design using the provided CAD software. Ensure dimensions are accurate and within the machine's capabilities."
        },
        {
          title: "Material Setup",
          description: "Place your metal sheet on the cutting bed. Ensure it's flat and properly secured with the clamps provided."
        },
        {
          title: "Machine Configuration",
          description: "Select appropriate power, speed, and focus settings based on material type and thickness using the control panel."
        },
        {
          title: "Ventilation Check",
          description: "Ensure the ventilation system is operational before starting the cut to remove harmful fumes."
        },
        {
          title: "Test Run",
          description: "Perform a test run without the laser to verify the cutting path is correct and clear of obstructions."
        },
        {
          title: "Execute Cutting Process",
          description: "Close safety shield, wear protective goggles, and initiate the cutting process through the control panel."
        },
        {
          title: "Post-Cut Procedure",
          description: "Wait for the machine to complete and ventilation to clear fumes. Only then open the shield and carefully remove your cut piece."
        }
      ],
      troubleshooting: [
        {
          issue: "Laser Not Cutting Through Material",
          solutions: [
            "Increase power settings",
            "Decrease cutting speed",
            "Check focus distance",
            "Verify material thickness is within machine specifications",
            "Clean lens of any debris or smudges"
          ]
        },
        {
          issue: "Irregular Cut Edges",
          solutions: [
            "Check for worn nozzle and replace if necessary",
            "Verify material is properly secured and flat",
            "Reduce cutting speed",
            "Check assist gas pressure",
            "Clean lens and mirrors of any contamination"
          ]
        },
        {
          issue: "Machine Won't Power On",
          solutions: [
            "Check power connections",
            "Verify emergency stop button is not engaged",
            "Check circuit breakers",
            "Inspect cooling system status",
            "Contact instructor if issues persist"
          ]
        }
      ]
    });
    
    // 2. Metal Drill Press
    await this.createDevice({
      name: "Metal Drill Press",
      icon: "drill",
      shortDescription: "Precision drilling machine for creating holes in metal workpieces",
      categoryId: drillingCategory.id,
      specifications: {
        "Motor Power": "1.5 HP",
        "Spindle Speed Range": "150-4200 RPM",
        "Drill Chuck Size": "5/8 inch (16mm)",
        "Max Drilling Capacity (Steel)": "25mm",
        "Table Size": "400mm x 400mm",
        "Column Diameter": "80mm"
      },
      materials: {
        "Mild Steel": "Excellent compatibility",
        "Stainless Steel": "Good with proper bits and cooling",
        "Aluminum": "Excellent compatibility",
        "Titanium Alloys": "Fair with specialized bits",
        "Cast Iron": "Good compatibility"
      },
      safetyRequirements: [
        "Always wear safety glasses or face shield",
        "Secure loose clothing, jewelry, and long hair",
        "Always secure workpiece firmly with clamps or vise",
        "Never adjust workpiece while drill is running",
        "Use cutting fluid for heat dissipation when drilling metals",
        "Ensure drill bit is sharp and properly installed",
        "Remove chips with brush, never by hand"
      ],
      usageInstructions: [
        {
          title: "Machine Setup",
          description: "Select the appropriate drill bit for your material. Secure it firmly in the chuck using the chuck key. Never leave the chuck key in the drill press."
        },
        {
          title: "Speed Selection",
          description: "Set the appropriate speed based on material and bit diameter. Harder metals and larger bits require slower speeds."
        },
        {
          title: "Workpiece Preparation",
          description: "Mark the drilling point with a center punch. This prevents the drill bit from wandering when starting the hole."
        },
        {
          title: "Secure Workpiece",
          description: "Clamp the workpiece firmly to the table using appropriate fixtures. Never hold the workpiece by hand."
        },
        {
          title: "Apply Cutting Fluid",
          description: "For most metals, apply cutting fluid to reduce heat and improve drilling quality."
        },
        {
          title: "Drilling Process",
          description: "Lower the drill slowly and steadily. Apply consistent pressure but allow the drill to cut at its own pace."
        },
        {
          title: "Hole Completion",
          description: "When completing a through hole, reduce pressure as the bit begins to break through to prevent binding."
        }
      ],
      troubleshooting: [
        {
          issue: "Drill Bit Wandering or Not Starting on Mark",
          solutions: [
            "Use a center punch to create a starting divot",
            "Start at a slower speed",
            "Use a shorter or more rigid drill bit",
            "Check that the drill bit is properly sharpened",
            "Ensure the table and workpiece are properly aligned"
          ]
        },
        {
          issue: "Excessive Heat or Smoking",
          solutions: [
            "Reduce drilling speed",
            "Apply more cutting fluid",
            "Check for dull drill bit and replace if necessary",
            "Use intermittent drilling technique (pecking) for deep holes",
            "Ensure using the correct bit for the material"
          ]
        },
        {
          issue: "Poor Hole Quality or Rough Finish",
          solutions: [
            "Check for worn or damaged drill bit",
            "Verify spindle speed is appropriate for material",
            "Use cutting fluid",
            "Ensure workpiece is firmly secured",
            "For finish holes, consider drilling under-size then reaming"
          ]
        }
      ]
    });
    
    // 3. TIG Welder
    await this.createDevice({
      name: "TIG Welder",
      icon: "bolt",
      shortDescription: "Tungsten Inert Gas welder for high-quality, precision metal joining",
      categoryId: weldingCategory.id,
      specifications: {
        "Power Input": "220V, Single Phase",
        "Output Range": "5-200 Amps",
        "Duty Cycle": "60% at 200A",
        "Pulse Frequency": "0.5-200 Hz",
        "Weight": "25kg",
        "Dimensions": "500mm x 300mm x 400mm",
        "Cooling": "Forced Air"
      },
      materials: {
        "Stainless Steel": "Excellent results",
        "Aluminum": "Very good with AC current",
        "Mild Steel": "Excellent results",
        "Copper Alloys": "Good with proper technique",
        "Titanium": "Excellent with proper shielding"
      },
      safetyRequirements: [
        "Always wear proper welding helmet with correct shade (10-13)",
        "Use flame-resistant clothing covering all exposed skin",
        "Wear dry, insulated gloves designed for welding",
        "Ensure proper ventilation to remove welding fumes",
        "Keep a fire extinguisher nearby",
        "Never weld on containers that held flammable materials",
        "Protect others from arc flash with welding screens",
        "Remove all flammable materials from welding area"
      ],
      usageInstructions: [
        {
          title: "Equipment Setup",
          description: "Connect ground clamp to workpiece. Install correct tungsten electrode size and type for your material. Ensure gas connections are secure."
        },
        {
          title: "Gas Selection",
          description: "Use pure argon for aluminum and stainless steel. Use argon/helium mix for thicker aluminum. Set flow rate between 15-20 CFH."
        },
        {
          title: "Machine Settings",
          description: "Select AC for aluminum and magnesium. Select DC- for steel, stainless steel, and most other metals. Set amperage according to material thickness."
        },
        {
          title: "Tungsten Preparation",
          description: "For DC welding, sharpen tungsten to a point. For AC welding, use a rounded end. The electrode should extend 1/8\" to 1/4\" beyond the cup."
        },
        {
          title: "Welding Technique",
          description: "Hold torch at 15-20° angle from vertical. Keep tungsten 1/8\" from the work. Add filler rod at shallow angle. Move steadily along joint."
        },
        {
          title: "Post-Weld Procedure",
          description: "Maintain gas flow for 5-10 seconds after stopping arc to protect cooling weld. Inspect weld for quality and consistency."
        }
      ],
      troubleshooting: [
        {
          issue: "Tungsten Contamination (Tungsten turning black or balling excessively)",
          solutions: [
            "Increase gas flow rate",
            "Check for gas leaks in the system",
            "Keep tungsten further from the weld pool",
            "Re-grind tungsten with dedicated tungsten grinder",
            "Ensure you're using the correct tungsten type for the application"
          ]
        },
        {
          issue: "Porosity in Weld",
          solutions: [
            "Clean base metal thoroughly with acetone or stainless brush",
            "Increase gas coverage or flow rate",
            "Check for drafts in welding area",
            "Maintain proper arc length",
            "Check for water leaks in torch cooling system (if water-cooled)"
          ]
        },
        {
          issue: "Poor Penetration",
          solutions: [
            "Increase amperage",
            "Reduce travel speed",
            "Ensure proper joint preparation and fit-up",
            "Check for proper ground connection",
            "Consider pre-heating thicker materials"
          ]
        }
      ]
    });
    
    // 4. Digital Caliper
    await this.createDevice({
      name: "Digital Caliper",
      icon: "straighten",
      shortDescription: "Precision measuring tool for accurate dimensional measurements",
      categoryId: measuringCategory.id,
      specifications: {
        "Range": "0-150mm (0-6 inches)",
        "Resolution": "0.01mm (0.0005 inches)",
        "Accuracy": "±0.02mm",
        "Display": "LCD Digital",
        "Battery": "SR44 or LR44",
        "Material": "Stainless Steel",
        "Measuring Modes": "Internal, External, Depth, Step"
      },
      materials: {
        "Metal Parts": "Excellent for all metal surfaces",
        "Plastic Components": "Good, take care not to apply excessive pressure",
        "Glass": "Use with caution",
        "Soft Materials": "May compress under pressure, affecting readings"
      },
      safetyRequirements: [
        "Handle with clean hands to prevent corrosion",
        "Store in protective case when not in use",
        "Do not drop or subject to impact",
        "Do not use as a scraper or marking tool",
        "Avoid contact with chemicals or cutting fluids",
        "Do not apply excessive pressure during measurements"
      ],
      usageInstructions: [
        {
          title: "Preparation",
          description: "Wipe measuring surfaces clean. Ensure the caliper reads zero when jaws are closed. If not, press the 'Zero' button."
        },
        {
          title: "External Measurement",
          description: "Place the object between the large jaws. Apply gentle pressure until the jaws contact the surface. Read the measurement on the display."
        },
        {
          title: "Internal Measurement",
          description: "Insert the smaller jaws into the cavity to be measured. Gently expand until contact is made with the surfaces. Read the measurement."
        },
        {
          title: "Depth Measurement",
          description: "Place the base flat on the surface. Extend the depth rod until it contacts the bottom of the cavity. Read the measurement."
        },
        {
          title: "Step Measurement",
          description: "Place the base on the lower surface. Lower the main jaw until it contacts the higher surface. Read the measurement."
        },
        {
          title: "Unit Conversion",
          description: "Press the 'mm/inch' button to switch between metric and imperial units as needed."
        }
      ],
      troubleshooting: [
        {
          issue: "Display Shows Erratic Readings",
          solutions: [
            "Replace battery",
            "Clean measuring surfaces with alcohol",
            "Check for debris in the track",
            "Ensure measuring pressure is consistent",
            "Reset the caliper by removing battery for 30 seconds"
          ]
        },
        {
          issue: "Digital Display is Blank or Dim",
          solutions: [
            "Replace battery",
            "Check battery orientation",
            "Clean battery contacts",
            "Press the 'ON' button",
            "If still not working, may need professional repair"
          ]
        },
        {
          issue: "Zero Function Not Working",
          solutions: [
            "Ensure jaws are completely closed when pressing 'Zero'",
            "Clean the measuring surfaces and tracks",
            "Replace battery",
            "Reset the caliper by removing battery for 30 seconds",
            "May require recalibration by instructor"
          ]
        }
      ]
    });
    
    // 5. Bench Grinder
    await this.createDevice({
      name: "Bench Grinder",
      icon: "build",
      shortDescription: "Stationary power tool used for sharpening, shaping, and finishing metal workpieces",
      categoryId: finishingCategory.id,
      specifications: {
        "Motor Power": "3/4 HP",
        "Wheel Size": "8 inch (200mm)",
        "Speed": "3450 RPM",
        "Wheel Types": "Coarse (36 grit), Fine (60 grit)",
        "Eye Shield": "Adjustable, Transparent",
        "Work Rest": "Adjustable, Cast Iron",
        "Wheel Guards": "Cast Iron"
      },
      materials: {
        "High-Speed Steel": "Excellent for sharpening",
        "Carbon Steel": "Very good",
        "Tool Steel": "Excellent",
        "Mild Steel": "Good",
        "Non-ferrous Metals": "Use dedicated wheel only"
      },
      safetyRequirements: [
        "Always wear impact-resistant safety glasses or face shield",
        "Never operate without wheel guards and eye shields in place",
        "Adjust work rests to within 1/8 inch (3mm) of wheel",
        "Stand to the side when starting the grinder",
        "Never use the side of the wheel for grinding",
        "Allow newly mounted wheels to run at operating speed for one minute before grinding",
        "Do not grind small pieces by hand",
        "Never adjust the work rest while the wheel is moving"
      ],
      usageInstructions: [
        {
          title: "Pre-Operation Inspection",
          description: "Check wheel for cracks or damage. Ensure guards and eye shields are in place. Verify work rest is properly adjusted."
        },
        {
          title: "Grinder Start-Up",
          description: "Stand to the side and turn on the power. Allow grinder to reach full speed before use."
        },
        {
          title: "Work Positioning",
          description: "Rest workpiece firmly on the work rest. Apply gentle pressure against the wheel. Move workpiece side to side across wheel face."
        },
        {
          title: "Metal Grinding",
          description: "Use the face of the wheel, not the side. Apply moderate pressure. Cool workpiece in water regularly to prevent overheating."
        },
        {
          title: "Tool Sharpening",
          description: "Hold tool at appropriate angle against wheel. Move tool smoothly across wheel face. Check progress frequently."
        },
        {
          title: "Shutdown Procedure",
          description: "Turn off grinder. Wait for wheel to come to a complete stop before leaving the area."
        }
      ],
      troubleshooting: [
        {
          issue: "Excessive Vibration",
          solutions: [
            "Check for uneven wheel wear",
            "Inspect for loose mounting bolts",
            "Verify wheel is properly balanced",
            "Check motor mounts",
            "Have wheel dressed by instructor"
          ]
        },
        {
          issue: "Wheel Glazing or Loading",
          solutions: [
            "Use wheel dressing tool to restore grinding surface",
            "Reduce pressure when grinding",
            "Ensure proper wheel type for material",
            "Clean wheel with cleaning stick",
            "May need wheel replacement if severely glazed"
          ]
        },
        {
          issue: "Excessive Sparking",
          solutions: [
            "Reduce grinding pressure",
            "Check that correct wheel is being used for material",
            "Ensure workpiece is properly cooled",
            "Have wheel dressed to restore surface",
            "Angle workpiece differently against wheel"
          ]
        }
      ]
    });
    
    // 6. Sheet Metal Shear
    await this.createDevice({
      name: "Sheet Metal Shear",
      icon: "content_cut",
      shortDescription: "Precision cutting tool for straight cuts in sheet metal with minimal distortion",
      categoryId: cuttingCategory.id,
      specifications: {
        "Cutting Capacity (Mild Steel)": "16 gauge (1.5mm)",
        "Cutting Capacity (Stainless Steel)": "18 gauge (1.2mm)",
        "Cutting Capacity (Aluminum)": "14 gauge (2.0mm)",
        "Blade Length": "52 inches (1320mm)",
        "Back Gauge Range": "0-24 inches (0-610mm)",
        "Front Support": "30 inches (760mm)",
        "Blade Angle": "2 degrees",
        "Floor Space Required": "66\" L x 62\" W x 43\" H"
      },
      materials: {
        "Mild Steel": "Up to 16 gauge",
        "Stainless Steel": "Up to 18 gauge",
        "Aluminum": "Up to 14 gauge",
        "Brass": "Up to 16 gauge",
        "Copper": "Up to 16 gauge",
        "Zinc": "Up to 14 gauge"
      },
      safetyRequirements: [
        "Always wear cut-resistant gloves when handling sheet metal",
        "Never place hands between or near the blades",
        "Maintain all guards and safety devices in proper working order",
        "Position material completely flat on the table before cutting",
        "Avoid cutting multiple sheets simultaneously unless designed for such operation",
        "Secure all sheet metal scraps before disposal",
        "Never attempt to cut rod, wire, or non-sheet materials",
        "Stay clear of the back of the machine during operation"
      ],
      usageInstructions: [
        {
          title: "Machine Setup",
          description: "Ensure shear is properly secured to floor. Adjust back gauge to desired cut length. Check blades for damage or misalignment."
        },
        {
          title: "Material Positioning",
          description: "Place sheet metal flat on table, against the back gauge and side guide. Hold material firmly in place."
        },
        {
          title: "Shearing Process",
          description: "Step on foot pedal with steady pressure to activate blade. Keep hands away from blade area. Support large sheets with helpers or material supports."
        },
        {
          title: "Dealing with Long Cuts",
          description: "For long cuts, support material on both sides of shear. Use roller supports for large sheets. Cut progressively from one end."
        },
        {
          title: "Maintenance",
          description: "Check blade clearance regularly. Clean shear table after use. Report any unusual sounds or difficulty in cutting."
        }
      ],
      troubleshooting: [
        {
          issue: "Burrs on Cut Edge",
          solutions: [
            "Check blade clearance adjustment",
            "Ensure blades are sharp and not damaged",
            "Adjust blade gap to material thickness",
            "Consider blade sharpening or replacement",
            "Verify material is within capacity specifications"
          ]
        },
        {
          issue: "Difficult Operation (Hard to Cut)",
          solutions: [
            "Check if material exceeds machine capacity",
            "Inspect for blade damage or dullness",
            "Adjust blade clearance",
            "Ensure proper hydraulic fluid levels",
            "Check for debris between blades"
          ]
        },
        {
          issue: "Uneven or Angled Cuts",
          solutions: [
            "Verify material is positioned square to blade",
            "Check machine level and alignment",
            "Ensure back gauge is parallel to blade",
            "Inspect hold-downs for proper operation",
            "Check for blade wear or damage"
          ]
        }
      ]
    });
    
    // 7. Metal Press Brake
    await this.createDevice({
      name: "Metal Press Brake",
      icon: "straight",
      shortDescription: "Machine for bending sheet and plate metal with precise control of angles and dimensions",
      categoryId: formingCategory.id,
      specifications: {
        "Bending Force": "60 tons",
        "Working Length": "96 inches (2440mm)",
        "Throat Depth": "8 inches (203mm)",
        "Maximum Stroke": "6 inches (152mm)",
        "Open Height": "16 inches (406mm)",
        "Control System": "CNC with 10.4\" touchscreen",
        "Back Gauge": "24 inch (610mm) CNC controlled",
        "Bending Accuracy": "±0.0012 inches (±0.03mm)",
        "Motor Power": "7.5 HP"
      },
      materials: {
        "Mild Steel": "Up to 10 gauge (3.4mm)",
        "Stainless Steel": "Up to 12 gauge (2.7mm)",
        "Aluminum": "Up to 8 gauge (4.2mm)",
        "Brass": "Up to 10 gauge (3.4mm)",
        "Copper": "Up to 10 gauge (3.4mm)"
      },
      safetyRequirements: [
        "Always wear safety glasses and steel-toed boots",
        "Keep hands away from the point of operation",
        "Use appropriate tooling for the material being formed",
        "Never exceed the machine's rated capacity",
        "Ensure the work area is clear of obstructions",
        "Use back gauges and stops whenever possible",
        "Operate the foot pedal only when in proper position",
        "Verify all guards and safety devices are functioning",
        "Never attempt to adjust tools while the machine is in operation"
      ],
      usageInstructions: [
        {
          title: "Machine Setup",
          description: "Select appropriate dies for material and desired bend. Install upper and lower tooling securely. Set up back gauge for desired bend location."
        },
        {
          title: "Programming",
          description: "Enter bending sequence in CNC control. Define material type, thickness, bend angles, and dimensions. Run simulation if available."
        },
        {
          title: "Test Bending",
          description: "Perform test bend on scrap piece of same material and thickness. Measure bend angle and dimensions. Adjust program as needed."
        },
        {
          title: "Production Bending",
          description: "Position material against back gauge and side stops. Operate foot pedal with steady pressure. Support large workpieces properly."
        },
        {
          title: "Multi-Bend Operations",
          description: "For complex parts, follow bending sequence as programmed. Reposition workpiece between bends as required. Verify critical dimensions periodically."
        },
        {
          title: "Finishing",
          description: "Remove workpiece carefully after final bend. Check all dimensions and angles. Deburr edges if necessary."
        }
      ],
      troubleshooting: [
        {
          issue: "Inconsistent Bend Angles",
          solutions: [
            "Verify material thickness consistency",
            "Check tooling for wear or damage",
            "Calibrate machine settings",
            "Ensure proper back gauge positioning",
            "Consider material springback compensation"
          ]
        },
        {
          issue: "Workpiece Slipping During Bending",
          solutions: [
            "Clean surfaces of tooling and material",
            "Check alignment of back gauge",
            "Use additional support for large workpieces",
            "Adjust clamping pressure",
            "Verify proper tooling setup"
          ]
        },
        {
          issue: "Material Deformation at Bending Point",
          solutions: [
            "Use larger radius die for material thickness",
            "Check that bend is along proper grain direction",
            "Ensure material is within machine capacity",
            "Adjust bending speed",
            "Consider using forming pads for delicate materials"
          ]
        }
      ]
    });
    
    // 8. Metal Lathe
    await this.createDevice({
      name: "Metal Lathe",
      icon: "rotate_right",
      shortDescription: "Precision machine tool that rotates a workpiece to perform various operations such as cutting, sanding, knurling, and turning",
      categoryId: machiningCategory.id,
      specifications: {
        "Swing Over Bed": "13 inches (330mm)",
        "Distance Between Centers": "40 inches (1000mm)",
        "Spindle Bore": "1.57 inches (40mm)",
        "Spindle Speed Range": "45-2000 RPM",
        "Spindle Mount": "D1-4 Camlock",
        "Tailstock Taper": "MT#3",
        "Cross Slide Travel": "6.5 inches (165mm)",
        "Compound Rest Travel": "3.15 inches (80mm)",
        "Threading Capability": "4-56 TPI / 0.4-7mm Metric",
        "Motor Power": "2 HP (1.5kW)"
      },
      materials: {
        "Mild Steel": "Excellent",
        "Alloy Steel": "Very good",
        "Stainless Steel": "Good with proper tooling and coolant",
        "Cast Iron": "Very good",
        "Aluminum": "Excellent",
        "Brass": "Excellent",
        "Bronze": "Very good",
        "Plastic": "Good with proper speeds and feeds"
      },
      safetyRequirements: [
        "Always wear safety glasses or face shield",
        "Remove jewelry, secure loose clothing, and tie back long hair",
        "Never leave chuck key in chuck",
        "Never measure workpiece while it is rotating",
        "Always ensure workpiece is securely clamped",
        "Stop machine before adjusting workpiece or tools",
        "Use brush to remove chips, never use hands",
        "Keep work area clean and free of oil or coolant spills",
        "Know location of emergency stop button",
        "Never leave machine running unattended"
      ],
      usageInstructions: [
        {
          title: "Machine Setup",
          description: "Select appropriate tooling for operation. Mount workpiece securely in chuck or between centers. Set machine to appropriate RPM based on material and operation."
        },
        {
          title: "Facing Operation",
          description: "Mount facing tool at center height. Set depth of cut 0.010-0.020\" for finishing cuts. Engage power feed from outside to center, or manually move cross slide evenly."
        },
        {
          title: "Turning Operation",
          description: "Mount turning tool at center height. Set depth of cut (0.050-0.100\" roughing, 0.010-0.020\" finishing). Engage longitudinal power feed and cut along workpiece length."
        },
        {
          title: "Drilling Operation",
          description: "Mount drill in tailstock chuck. Advance tailstock to appropriate position. Start with center drill if necessary. Apply cutting fluid and advance drill with tailstock handwheel."
        },
        {
          title: "Threading Operation",
          description: "Set machine to appropriate thread pitch. Use threading tool ground to thread profile. Set compound at 29° angle. Take multiple light passes, retracting tool at end of each pass."
        },
        {
          title: "Knurling Operation",
          description: "Mount knurling tool in tool post. Position tool at center height. Apply moderate pressure and engage power feed at slow speed. Use cutting oil for lubrication."
        }
      ],
      troubleshooting: [
        {
          issue: "Poor Surface Finish",
          solutions: [
            "Check for tool sharpness and proper geometry",
            "Reduce feed rate",
            "Increase RPM if possible",
            "Use cutting fluid appropriate for material",
            "Verify rigidity of workholding setup",
            "Ensure tool is at center height"
          ]
        },
        {
          issue: "Chatter During Cutting",
          solutions: [
            "Reduce tool overhang",
            "Increase rigidity of workholding",
            "Reduce depth of cut",
            "Adjust RPM to avoid resonance",
            "Use sharper cutting tools",
            "Check for loose gibs or bearings"
          ]
        },
        {
          issue: "Inaccurate Dimensions",
          solutions: [
            "Check for wear in lead screws or gibs",
            "Verify calibration of dials or DRO",
            "Account for tool deflection in deep cuts",
            "Allow for material springback",
            "Consider material expansion from heat",
            "Take lighter finish passes"
          ]
        },
        {
          issue: "Tool Breakage",
          solutions: [
            "Reduce depth of cut",
            "Ensure proper tool geometry for material",
            "Use cutting fluid",
            "Check for adequate tool support",
            "Reduce feed rate",
            "Verify material hardness is within range"
          ]
        }
      ]
    });
  }

  // Device Categories
  async getAllDeviceCategories(): Promise<DeviceCategory[]> {
    return Array.from(this.deviceCategories.values());
  }
  
  async getDeviceCategory(id: number): Promise<DeviceCategory | undefined> {
    return this.deviceCategories.get(id);
  }
  
  async createDeviceCategory(category: InsertDeviceCategory): Promise<DeviceCategory> {
    const id = this.categoryId++;
    const newCategory: DeviceCategory = { ...category, id };
    this.deviceCategories.set(id, newCategory);
    return newCategory;
  }
  
  // Devices
  async getAllDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }
  
  async getDevicesByCategory(categoryId: number): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(
      device => device.categoryId === categoryId
    );
  }
  
  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }
  
  async createDevice(device: InsertDevice): Promise<Device> {
    const id = this.deviceId++;
    const newDevice: Device = { ...device, id };
    this.devices.set(id, newDevice);
    return newDevice;
  }
  
  // Chat Messages
  async getChatMessages(deviceId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.deviceId === deviceId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.messageId++;
    const newMessage: ChatMessage = { ...message, id };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async clearChatMessages(deviceId: number): Promise<void> {
    // Find all messages for this device
    const messagesToDelete = Array.from(this.chatMessages.values())
      .filter(message => message.deviceId === deviceId);
    
    // Delete each message
    for (const message of messagesToDelete) {
      this.chatMessages.delete(message.id);
    }
  }
  
  // End of MemStorage class methods
}

export const storage = new MemStorage();
