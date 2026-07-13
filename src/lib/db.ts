import knex from 'knex';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

export const isPostgres = !!(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PGHOST);

const WORLD_REHMAT_PRODUCTS = [
  { name: 'World UPVC Elbow', sku: 'WORLD-UPVC-FIT-ELBOW-2', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '2"', packing: '120 Piece', unit: 'Piece', price: 170 },
  { name: 'World UPVC Elbow', sku: 'WORLD-UPVC-FIT-ELBOW-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '60 Piece', unit: 'Piece', price: 350 },
  { name: 'World UPVC Elbow', sku: 'WORLD-UPVC-FIT-ELBOW-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '36 Piece', unit: 'Piece', price: 520 },
  { name: 'World UPVC Elbow 45D', sku: 'WORLD-UPVC-FIT-ELBOW-45D-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '75 Piece', unit: 'Piece', price: 350 },
  { name: 'World UPVC Elbow 45D', sku: 'WORLD-UPVC-FIT-ELBOW-45D-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '42 Piece', unit: 'Piece', price: 520 },
  { name: 'World UPVC Elbow Reduce', sku: 'WORLD-UPVC-FIT-ELBOW-REDUCE-3X4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3 x 4', packing: '57 Piece', unit: 'Piece', price: 670 },
  { name: 'World UPVC Elbow Plug', sku: 'WORLD-UPVC-FIT-ELBOW-PLUG-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '44 Piece', unit: 'Piece', price: 760 },
  { name: 'World UPVC Elbow Plug', sku: 'WORLD-UPVC-FIT-ELBOW-PLUG-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '30 Piece', unit: 'Piece', price: 900 },
  { name: 'World UPVC Elbow MF', sku: 'WORLD-UPVC-FIT-ELBOW-MF-2', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '2"', packing: '120 Piece', unit: 'Piece', price: 220 },
  { name: 'World UPVC Elbow MF', sku: 'WORLD-UPVC-FIT-ELBOW-MF-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '60 Piece', unit: 'Piece', price: 500 },
  { name: 'World UPVC Elbow MF', sku: 'WORLD-UPVC-FIT-ELBOW-MF-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '36 Piece', unit: 'Piece', price: 690 },
  { name: 'World UPVC Tee', sku: 'WORLD-UPVC-FIT-TEE-2', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '2"', packing: '100 Piece', unit: 'Piece', price: 308 },
  { name: 'World UPVC Tee', sku: 'WORLD-UPVC-FIT-TEE-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '40 Piece', unit: 'Piece', price: 570 },
  { name: 'World UPVC Tee', sku: 'WORLD-UPVC-FIT-TEE-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '24 Piece', unit: 'Piece', price: 910 },
  { name: 'World UPVC Tee Reduce', sku: 'WORLD-UPVC-FIT-TEE-REDUCE-3X4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3 x 4', packing: '30 Piece', unit: 'Piece', price: 914 },
  { name: 'World UPVC Tee Reduce', sku: 'WORLD-UPVC-FIT-TEE-REDUCE-2X4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '2 x 4', packing: '30 Piece', unit: 'Piece', price: 914 },
  { name: 'World UPVC Tee Plug', sku: 'WORLD-UPVC-FIT-TEE-PLUG-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '34 Piece', unit: 'Piece', price: 954 },
  { name: 'World UPVC Tee Plug', sku: 'WORLD-UPVC-FIT-TEE-PLUG-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '18 Piece', unit: 'Piece', price: 1150 },
  { name: 'World UPVC Y-Tee', sku: 'WORLD-UPVC-FIT-Y-TEE-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '30 Piece', unit: 'Piece', price: 760 },
  { name: 'World UPVC Y-Tee', sku: 'WORLD-UPVC-FIT-Y-TEE-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '16 Piece', unit: 'Piece', price: 1130 },
  { name: 'World UPVC Y-Tee Reduce', sku: 'WORLD-UPVC-FIT-Y-TEE-REDUCE-3X4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3 x 4', packing: '17 Piece', unit: 'Piece', price: 1160 },
  { name: 'World UPVC P-Trap', sku: 'WORLD-UPVC-FIT-P-TRAP-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '36 Piece', unit: 'Piece', price: 950 },
  { name: 'World UPVC P-Trap', sku: 'WORLD-UPVC-FIT-P-TRAP-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '18 Piece', unit: 'Piece', price: 1320 },
  { name: 'World UPVC End Cap', sku: 'WORLD-UPVC-FIT-END-CAP-3', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '3"', packing: '12 Piece', unit: 'Piece', price: 180 },
  { name: 'World UPVC End Cap', sku: 'WORLD-UPVC-FIT-END-CAP-4', category: 'uPVC Fittings', brand: 'World', product_line: 'UPVC Fittings', size: '4"', packing: '12 Piece', unit: 'Piece', price: 300 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-1', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '1"', packing: 'Pipe', unit: 'Pipe', price: 480 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-1-1-4', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '1¼"', packing: 'Pipe', unit: 'Pipe', price: 775 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-2', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '2"', packing: 'Pipe', unit: 'Pipe', price: 960 },
  { name: 'World PVC Pure Colour B Class Pipe', sku: 'WORLD-PVC-PURE-B-CLASS-3', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - B Class', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 2400 },
  { name: 'World PVC Pure Colour Medium Pipe', sku: 'WORLD-PVC-PURE-MEDIUM-3', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Medium', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 1680 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-3', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 1200 },
  { name: 'World PVC Pure Colour B Class Pipe', sku: 'WORLD-PVC-PURE-B-CLASS-4', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - B Class', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 2880 },
  { name: 'World PVC Pure Colour Medium Pipe', sku: 'WORLD-PVC-PURE-MEDIUM-4', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Medium', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 2160 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-4', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 1680 },
  { name: 'World PVC Pure Colour Medium Pipe', sku: 'WORLD-PVC-PURE-MEDIUM-5', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Medium', size: '5"', packing: 'Pipe', unit: 'Pipe', price: 4800 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-5', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '5"', packing: 'Pipe', unit: 'Pipe', price: 3360 },
  { name: 'World PVC Pure Colour Medium Pipe', sku: 'WORLD-PVC-PURE-MEDIUM-6', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Medium', size: '6"', packing: 'Pipe', unit: 'Pipe', price: 5760 },
  { name: 'World PVC Pure Colour Conduit Pipe', sku: 'WORLD-PVC-PURE-CONDUIT-6', category: 'uPVC Pipes', brand: 'World', product_line: 'PVC Pure Colour - Conduit', size: '6"', packing: 'Pipe', unit: 'Pipe', price: 4080 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-2', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '2"', packing: 'Pipe', unit: 'Pipe', price: 850 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-2', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '2"', packing: '10 ft Pipe', unit: 'Pipe', price: 770 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-3', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 1400 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-3', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '3"', packing: '10 ft Pipe', unit: 'Pipe', price: 1080 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-4', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 1920 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-4', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '4"', packing: '10 ft Pipe', unit: 'Pipe', price: 1475 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-5', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '5"', packing: 'Pipe', unit: 'Pipe', price: 2800 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-5', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '5"', packing: '10 ft Pipe', unit: 'Pipe', price: 2150 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-6', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '6"', packing: 'Pipe', unit: 'Pipe', price: 3600 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-6', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '6"', packing: '10 ft Pipe', unit: 'Pipe', price: 2770 },
  { name: 'Super Master U-PVC White Medium Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-8', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium', size: '8"', packing: 'Pipe', unit: 'Pipe', price: 8800 },
  { name: 'Super Master U-PVC White Medium 10ft Pipe', sku: 'SM-UPVC-WHITE-MEDIUM-10FT-8', category: 'uPVC Pipes', brand: 'Super Master', product_line: 'U-PVC White - Medium 10ft', size: '8"', packing: '10 ft Pipe', unit: 'Pipe', price: 6700 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-1', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '1"', packing: 'Pipe', unit: 'Pipe', price: 720 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-1-1-4', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '1¼"', packing: 'Pipe', unit: 'Pipe', price: 960 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-1-1-2', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '1½"', packing: 'Pipe', unit: 'Pipe', price: 1080 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-1-3-4', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '1¾"', packing: 'Pipe', unit: 'Pipe', price: 1320 },
  { name: 'Rehmat Industry Super Master Blue UPVC C Class Pipe', sku: 'RI-SM-BLUE-C-CLASS-2', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - C Class', size: '2"', packing: 'Pipe', unit: 'Pipe', price: 1800 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-2', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '2"', packing: 'Pipe', unit: 'Pipe', price: 1200 },
  { name: 'Rehmat Industry Super Master Blue UPVC C Class Pipe', sku: 'RI-SM-BLUE-C-CLASS-3', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - C Class', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 3000 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-3', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '3"', packing: 'Pipe', unit: 'Pipe', price: 2100 },
  { name: 'Rehmat Industry Super Master Blue UPVC D Class Pipe', sku: 'RI-SM-BLUE-D-CLASS-4', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - D Class', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 4800 },
  { name: 'Rehmat Industry Super Master Blue UPVC C Class Pipe', sku: 'RI-SM-BLUE-C-CLASS-4', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - C Class', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 4200 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-4', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '4"', packing: 'Pipe', unit: 'Pipe', price: 2700 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-5', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '5"', packing: 'Pipe', unit: 'Pipe', price: 4200 },
  { name: 'Rehmat Industry Super Master Blue UPVC B Class Pipe', sku: 'RI-SM-BLUE-B-CLASS-6', category: 'uPVC Pipes', brand: 'Rehmat Industry', product_line: 'Super Master Blue UPVC - B Class', size: '6"', packing: 'Pipe', unit: 'Pipe', price: 5400 },
  { name: 'Super Master Jointing Solution', sku: 'SM-JOINTING-SOLUTION-50G', category: 'Jointing Solutions', brand: 'Super Master', product_line: 'Jointing Solution', size: '50g', packing: 'Container', unit: 'Container', price: 80 },
  { name: 'World Jointing Solution', sku: 'WORLD-JOINTING-SOLUTION-50G', category: 'Jointing Solutions', brand: 'World', product_line: 'Jointing Solution', size: '50g', packing: 'Container', unit: 'Container', price: 90 },
  { name: 'Super Master Jointing Solution', sku: 'SM-JOINTING-SOLUTION-75G', category: 'Jointing Solutions', brand: 'Super Master', product_line: 'Jointing Solution', size: '75g', packing: 'Container', unit: 'Container', price: 120 },
  { name: 'World Jointing Solution', sku: 'WORLD-JOINTING-SOLUTION-75G', category: 'Jointing Solutions', brand: 'World', product_line: 'Jointing Solution', size: '75g', packing: 'Container', unit: 'Container', price: 130 },
  { name: 'Super Master Jointing Solution', sku: 'SM-JOINTING-SOLUTION-125G', category: 'Jointing Solutions', brand: 'Super Master', product_line: 'Jointing Solution', size: '125g', packing: 'Container', unit: 'Container', price: 175 },
  { name: 'World Jointing Solution', sku: 'WORLD-JOINTING-SOLUTION-125G', category: 'Jointing Solutions', brand: 'World', product_line: 'Jointing Solution', size: '125g', packing: 'Container', unit: 'Container', price: 180 },
  { name: 'Super Master Jointing Solution', sku: 'SM-JOINTING-SOLUTION-250G', category: 'Jointing Solutions', brand: 'Super Master', product_line: 'Jointing Solution', size: '250g', packing: 'Container', unit: 'Container', price: 300 },
  { name: 'World Jointing Solution', sku: 'WORLD-JOINTING-SOLUTION-250G', category: 'Jointing Solutions', brand: 'World', product_line: 'Jointing Solution', size: '250g', packing: 'Container', unit: 'Container', price: 300 },
  { name: 'Super Master Jointing Solution', sku: 'SM-JOINTING-SOLUTION-500G', category: 'Jointing Solutions', brand: 'Super Master', product_line: 'Jointing Solution', size: '500g', packing: 'Container', unit: 'Container', price: 600 },
  { name: 'World Jointing Solution', sku: 'WORLD-JOINTING-SOLUTION-500G', category: 'Jointing Solutions', brand: 'World', product_line: 'Jointing Solution', size: '500g', packing: 'Container', unit: 'Container', price: 600 },
];

const SUPER_MASTER_BLUE_FITTINGS = [
  { name: 'Super Master Blue Screw Plug', sku: 'SM-BLUE-FIT-SCREW-PLUG', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '150 Piece', unit: 'Piece', price: 80, file: 'screw plug.png' },
  { name: 'Super Master Blue Female Joint', sku: 'SM-BLUE-FIT-FEMALE', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '100 Piece', unit: 'Piece', price: 110, file: 'female.png' },
  { name: 'Super Master Blue Female Elbow', sku: 'SM-BLUE-FIT-FEMALE-ELBOW', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 1/2"', packing: '100 Piece', unit: 'Piece', price: 130, file: 'female elbow.png' },
  { name: 'Super Master Blue Socket', sku: 'SM-BLUE-FIT-SOCKET', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '100 Piece', unit: 'Piece', price: 95, file: 'socket.png' },
  { name: 'Super Master Blue Underground Stop Cock', sku: 'SM-BLUE-FIT-UG-STOP-COCK', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '50 Piece', unit: 'Piece', price: 350, file: 'underground.png' },
  { name: 'Super Master Blue Stop Cock', sku: 'SM-BLUE-FIT-STOP-COCK', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '50 Piece', unit: 'Piece', price: 290, file: 'stop cock.png' },
  { name: 'Super Master Blue Tee', sku: 'SM-BLUE-FIT-TEE', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '80 Piece', unit: 'Piece', price: 140, file: 'tee.png' },
  { name: 'Super Master Blue Female Socket (Brass)', sku: 'SM-BLUE-FIT-FEMALE-SOCKET', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 1/2"', packing: '100 Piece', unit: 'Piece', price: 180, file: 'female socket.png' },
  { name: 'Super Master Blue Overcross Bend', sku: 'SM-BLUE-FIT-OVERCROSS-BEND', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '60 Piece', unit: 'Piece', price: 160, file: 'overcross bend.png' },
  { name: 'Super Master Blue Female Elbow (Brass) II', sku: 'SM-BLUE-FIT-FEMALE-ELBOW-2', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 210, file: 'female elbow 2.png' },
  { name: 'Super Master Blue Female Socket (Brass) II', sku: 'SM-BLUE-FIT-FEMALE-SOCKET-2', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 220, file: 'female socket 2.png' },
  { name: 'Super Master Blue Reduce Elbow', sku: 'SM-BLUE-FIT-REDUCE-ELBOW', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 120, file: 'reduce elbow.png' },
  { name: 'Super Master Blue Union Plastic', sku: 'SM-BLUE-FIT-UNION-PLASTIC', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '50 Piece', unit: 'Piece', price: 240, file: 'union plastic.png' },
  { name: 'Super Master Blue Female Tee (Brass) II', sku: 'SM-BLUE-FIT-FEMALE-TEE-2', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '80 Piece', unit: 'Piece', price: 260, file: 'female tee 2.png' },
  { name: 'Super Master Blue Wall Shower Adjustment', sku: 'SM-BLUE-FIT-WALL-SHOWER', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1/2"', packing: '50 Piece', unit: 'Piece', price: 320, file: 'wall_adjustment_jpg.png' },
  { name: 'Super Master Blue Reduce Tee', sku: 'SM-BLUE-FIT-REDUCE-TEE', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '80 Piece', unit: 'Piece', price: 150, file: 'reduce tee.png' },
  { name: 'Super Master Blue End Cap', sku: 'SM-BLUE-FIT-END-CAP', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '150 Piece', unit: 'Piece', price: 60, file: 'end cap.png' },
  { name: 'Super Master Blue Reduce Socket', sku: 'SM-BLUE-FIT-REDUCE-SOCKET', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 3/4"', packing: '120 Piece', unit: 'Piece', price: 110, file: 'reduce socket.png' },
  { name: 'Super Master Blue Female Tee', sku: 'SM-BLUE-FIT-FEMALE-TEE', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1 x 1/2"', packing: '80 Piece', unit: 'Piece', price: 230, file: 'female tee.png' },
  { name: 'Super Master Blue Elbow', sku: 'SM-BLUE-FIT-ELBOW', category: 'uPVC Fittings', brand: 'Super Master', product_line: 'Super Master Blue Fittings', size: '1"', packing: '100 Piece', unit: 'Piece', price: 105, file: 'elbow.png' }
];

async function ensureSuperMasterBlueFittings() {
  const warehouses = ['Main Factory (A-1)', 'Secondary Storage (B-4)', 'Regional Hub (North)', 'Central WH', 'Shop Display'];
  for (const product of SUPER_MASTER_BLUE_FITTINGS) {
    const inventoryData = {
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      product_line: product.product_line,
      size: product.size,
      packing: product.packing,
      unit: product.unit,
      color: 'Blue',
      price: product.price,
      image: `/product-images/${product.file}`,
      stock: 50,
      display_stock: 10,
      warehouse_stock: 40,
      minStock: 10,
      status: 'Active',
      description: `Premium range Super Master Blue pipe fittings - ${product.name} engineered for leak-proof flow solutions.`
    };

    const existing = await db('inventory').where({ sku: product.sku }).first();
    let inventoryId = existing?.id;

    if (existing) {
      await db('inventory').where({ id: existing.id }).update({
        name: inventoryData.name,
        category: inventoryData.category,
        brand: inventoryData.brand,
        product_line: inventoryData.product_line,
        size: inventoryData.size,
        packing: inventoryData.packing,
        unit: inventoryData.unit,
        color: inventoryData.color,
        image: (existing.image && 
                existing.image !== '/product-images/world-upvc-fittings.jpeg' && 
                existing.image !== '/product-images/world-upvc-pipes.jpeg') 
                ? existing.image 
                : inventoryData.image,
        price: inventoryData.price,
        description: inventoryData.description,
        status: inventoryData.status,
      });
    } else {
      const insertResult = await db('inventory').insert(inventoryData).returning('id');
      const idObj = insertResult[0];
      inventoryId = typeof idObj === 'object' ? idObj.id : idObj;
    }

    if (inventoryId) {
      const stockRows = await db('warehouse_stocks').where({ inventory_id: inventoryId });
      if (stockRows.length === 0) {
        await db('warehouse_stocks').insert([
          { inventory_id: inventoryId, warehouse_name: 'Main Factory (A-1)', stock: 40 },
          { inventory_id: inventoryId, warehouse_name: 'Shop Display', stock: 10 },
          { inventory_id: inventoryId, warehouse_name: 'Secondary Storage (B-4)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Regional Hub (North)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Central WH', stock: 0 },
        ]);
      } else {
        for (const warehouse of warehouses) {
          const wRow = await db('warehouse_stocks').where({ inventory_id: inventoryId, warehouse_name: warehouse }).first();
          if (!wRow) {
            await db('warehouse_stocks').insert({
              inventory_id: inventoryId,
              warehouse_name: warehouse,
              stock: warehouse === 'Main Factory (A-1)' ? 40 : (warehouse === 'Shop Display' ? 10 : 0)
            });
          }
        }
      }
    }
  }
}

const SUPER_MASTER_GREEN_PRODUCTS = [
  { name: 'Super Master Green Elbow 45D', sku: 'SM-GREEN-FIT-ELBOW-45D', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '80 Piece', unit: 'Piece', price: 125, file: 'elbow_25mm_45_degree.png' },
  { name: 'Super Master Green Elbow', sku: 'SM-GREEN-FIT-ELBOW', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '100 Piece', unit: 'Piece', price: 110, file: 'elbow_25mm.png' },
  { name: 'Super Master Green End Cap', sku: 'SM-GREEN-FIT-END-CAP', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '150 Piece', unit: 'Piece', price: 65, file: 'end_cap_p.png' },
  { name: 'Super Master Green Female Elbow', sku: 'SM-GREEN-FIT-FEMALE-ELBOW-1', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 1/2"', packing: '100 Piece', unit: 'Piece', price: 135, file: 'mixer_elbow_32mmx_half_inch_p.png' },
  { name: 'Super Master Green Female Elbow (Brass)', sku: 'SM-GREEN-FIT-FEMALE-ELBOW-2', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 215, file: 'elbow_32x3by4_p.png' },
  { name: 'Super Master Green Female Socket', sku: 'SM-GREEN-FIT-FEMALE-SOCKET-1', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 1/2"', packing: '100 Piece', unit: 'Piece', price: 185, file: 'socket_32mm_x_1_p.png' },
  { name: 'Super Master Green Female Socket (Brass)', sku: 'SM-GREEN-FIT-FEMALE-SOCKET-2', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 225, file: 'socket_32x3by4_p.png' },
  { name: 'Super Master Green Female Tee', sku: 'SM-GREEN-FIT-FEMALE-TEE-1', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 1/2"', packing: '80 Piece', unit: 'Piece', price: 235, file: 'tee_25xhalf_p.png' },
  { name: 'Super Master Green Female Tee (Brass)', sku: 'SM-GREEN-FIT-FEMALE-TEE-2', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 3/4"', packing: '80 Piece', unit: 'Piece', price: 265, file: 'tea_32mm_x_1_p.png' },
  { name: 'Super Master Green Gate Valve', sku: 'SM-GREEN-FIT-GATE-VALVE', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '40 Piece', unit: 'Piece', price: 420, file: 'gate_valve_p.png' },
  { name: 'Super Master Green Hooks', sku: 'SM-GREEN-FIT-HOOKS', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '500 Piece', unit: 'Piece', price: 15, file: 'hooks.jpg' },
  { name: 'Super Master Green Nozzle Cock', sku: 'SM-GREEN-FIT-NOZZLE-COCK', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1/2"', packing: '60 Piece', unit: 'Piece', price: 280, file: 'nozle cock.jpg' },
  { name: 'Super Master Green Overcross Bend', sku: 'SM-GREEN-FIT-OVERCROSS-BEND', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '60 Piece', unit: 'Piece', price: 165, file: 'overcross bend.jpg' },
  { name: 'Super Master Green PPRC Bibcock', sku: 'SM-GREEN-FIT-BIBCOCK', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1/2"', packing: '50 Piece', unit: 'Piece', price: 310, file: 'pprc_bibcok.png' },
  { name: 'Super Master Green PPRC Pipe', sku: 'SM-GREEN-PIPE-PPRC', category: 'PPRC Pipes', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '10 Piece', unit: 'Pipe', price: 450, file: 'pprc_pipes.png' },
  { name: 'Super Master Green Reduce Elbow', sku: 'SM-GREEN-FIT-REDUCE-ELBOW', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 3/4"', packing: '100 Piece', unit: 'Piece', price: 125, file: 'reduce elbow.jpg' },
  { name: 'Super Master Green Reduce Tee', sku: 'SM-GREEN-FIT-REDUCE-TEE', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1 x 3/4"', packing: '80 Piece', unit: 'Piece', price: 155, file: 'reduce tee.jpg' },
  { name: 'Super Master Green Screw Plug', sku: 'SM-GREEN-FIT-SCREW-PLUG', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '150 Piece', unit: 'Piece', price: 85, file: 'screw_plug_p.png' },
  { name: 'Super Master Green Socket (PPRC)', sku: 'SM-GREEN-FIT-SOCKET-PPRC', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '120 Piece', unit: 'Piece', price: 90, file: 'socket_32mm_x_1_p.png' },
  { name: 'Super Master Green Socket', sku: 'SM-GREEN-FIT-SOCKET', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '100 Piece', unit: 'Piece', price: 95, file: 'socket_32mm_x_1_p.png' },
  { name: 'Super Master Green Stopcock', sku: 'SM-GREEN-FIT-STOPCOCK', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '50 Piece', unit: 'Piece', price: 295, file: 'stopcock.png' },
  { name: 'Super Master Green Tee', sku: 'SM-GREEN-FIT-TEE', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '80 Piece', unit: 'Piece', price: 145, file: 'tee_32mm_p.png' },
  { name: 'Super Master Green Underground Stop Cock', sku: 'SM-GREEN-FIT-UG-STOPCOCK', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '50 Piece', unit: 'Piece', price: 355, file: 'under_groud.png' },
  { name: 'Super Master Green Union Plastic', sku: 'SM-GREEN-FIT-UNION-PLASTIC', category: 'PPRC Fittings', brand: 'Super Master', product_line: 'Super Master Green PPRC', size: '1"', packing: '50 Piece', unit: 'Piece', price: 245, file: 'union.jpg' }
];

async function ensureSuperMasterGreenProducts() {
  const warehouses = ['Main Factory (A-1)', 'Secondary Storage (B-4)', 'Regional Hub (North)', 'Central WH', 'Shop Display'];
  for (const product of SUPER_MASTER_GREEN_PRODUCTS) {
    const inventoryData = {
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      product_line: product.product_line,
      size: product.size,
      packing: product.packing,
      unit: product.unit,
      color: 'Green',
      price: product.price,
      image: `/product-images/${product.file}`,
      stock: 50,
      display_stock: 10,
      warehouse_stock: 40,
      minStock: 10,
      status: 'Active',
      description: `Premium range Super Master PPRC Green fittings & line - ${product.name} engineered for ultimate long-lasting non-leak joinery.`
    };

    const existing = await db('inventory').where({ sku: product.sku }).first();
    let inventoryId = existing?.id;

    if (existing) {
      await db('inventory').where({ id: existing.id }).update({
        name: inventoryData.name,
        category: inventoryData.category,
        brand: inventoryData.brand,
        product_line: inventoryData.product_line,
        size: inventoryData.size,
        packing: inventoryData.packing,
        unit: inventoryData.unit,
        color: inventoryData.color,
        image: (existing.image && 
                existing.image !== '/product-images/world-upvc-fittings.jpeg' && 
                existing.image !== '/product-images/world-upvc-pipes.jpeg') 
                ? existing.image 
                : inventoryData.image,
        price: inventoryData.price,
        description: inventoryData.description,
        status: inventoryData.status,
      });
    } else {
      const insertResult = await db('inventory').insert(inventoryData).returning('id');
      const idObj = insertResult[0];
      inventoryId = typeof idObj === 'object' ? idObj.id : idObj;
    }

    if (inventoryId) {
      const stockRows = await db('warehouse_stocks').where({ inventory_id: inventoryId });
      if (stockRows.length === 0) {
        await db('warehouse_stocks').insert([
          { inventory_id: inventoryId, warehouse_name: 'Main Factory (A-1)', stock: 40 },
          { inventory_id: inventoryId, warehouse_name: 'Shop Display', stock: 10 },
          { inventory_id: inventoryId, warehouse_name: 'Secondary Storage (B-4)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Regional Hub (North)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Central WH', stock: 0 },
        ]);
      } else {
        for (const warehouse of warehouses) {
          const wRow = await db('warehouse_stocks').where({ inventory_id: inventoryId, warehouse_name: warehouse }).first();
          if (!wRow) {
            await db('warehouse_stocks').insert({
              inventory_id: inventoryId,
              warehouse_name: warehouse,
              stock: warehouse === 'Main Factory (A-1)' ? 40 : (warehouse === 'Shop Display' ? 10 : 0)
            });
          }
        }
      }
    }
  }
}

async function ensureWorldRehmatProducts() {
  for (const product of WORLD_REHMAT_PRODUCTS) {
    const productLine = product.product_line.toLowerCase();
    const nameLower = product.name.toLowerCase();
    const skuLower = product.sku.toLowerCase();

    let image = '/product-images/upvc_pipes_2.png';
    if (product.category === 'uPVC Pipes') {
      image = '/product-images/upvc_pipes_2.png';
    } else if (product.category === 'Jointing Solutions' || nameLower.includes('jointing solution')) {
      image = '/product-images/jointing_solution.png';
    } else if (product.category === 'uPVC Fittings') {
      if (nameLower.includes('reduce elbow') || skuLower.includes('reduce-elbow') || skuLower.includes('elbow-reduce')) {
        image = '/product-images/reduce elbow.png';
      } else if (nameLower.includes('elbow') || skuLower.includes('elbow')) {
        image = '/product-images/elbow.png';
      } else if (nameLower.includes('reduce tee') || skuLower.includes('reduce-tee') || skuLower.includes('tee-reduce')) {
        image = '/product-images/reduce tee.png';
      } else if (nameLower.includes('tee') || skuLower.includes('tee')) {
        image = '/product-images/tee.png';
      } else if (nameLower.includes('p-trap') || skuLower.includes('p-trap')) {
        image = '/product-images/underground.png';
      } else if (nameLower.includes('end cap') || skuLower.includes('end-cap') || nameLower.includes('endcap')) {
        image = '/product-images/end cap.png';
      } else {
        image = '/product-images/elbow.png';
      }
    }

    const color = productLine.includes('blue')
      ? 'Blue'
      : productLine.includes('white')
        ? 'White'
        : productLine.includes('pure colour')
          ? 'Pure Colour'
          : '';
    const inventoryData = {
      ...product,
      color,
      image,
      stock: 0,
      display_stock: 0,
      warehouse_stock: 0,
      minStock: 10,
      status: 'ACTIVE',
      description: `${product.brand} ${product.product_line}; size ${product.size}; packing ${product.packing}; price list effective 01-04-2026.`,
    };

    const existing = await db('inventory').where({ sku: product.sku }).first();
    let inventoryId = existing?.id;

    if (existing) {
      await db('inventory').where({ id: existing.id }).update({
        name: inventoryData.name,
        category: inventoryData.category,
        brand: inventoryData.brand,
        product_line: inventoryData.product_line,
        size: inventoryData.size,
        packing: inventoryData.packing,
        unit: inventoryData.unit,
        color: inventoryData.color,
        image: (existing.image && 
                existing.image !== '/product-images/world-upvc-fittings.jpeg' && 
                existing.image !== '/product-images/world-upvc-pipes.jpeg') 
                ? existing.image 
                : inventoryData.image,
        price: inventoryData.price,
        description: inventoryData.description,
        status: inventoryData.status,
      });
    } else {
      const insertResult = await db('inventory').insert(inventoryData).returning('id');
      const idObj = insertResult[0];
      inventoryId = typeof idObj === 'object' ? idObj.id : idObj;
    }

    if (inventoryId) {
      const stockRows = await db('warehouse_stocks').where({ inventory_id: inventoryId });
      if (stockRows.length === 0) {
        await db('warehouse_stocks').insert([
          { inventory_id: inventoryId, warehouse_name: 'Main Factory (A-1)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Secondary Storage (B-4)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Regional Hub (North)', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Central WH', stock: 0 },
          { inventory_id: inventoryId, warehouse_name: 'Shop Display', stock: 0 },
        ]);
      }
    }
  }
}

async function ensureWarehouseRowsForInventory() {
  const items = await db('inventory').select('id', 'stock', 'display_stock', 'warehouse_stock');
  const warehouses = ['Main Factory (A-1)', 'Secondary Storage (B-4)', 'Regional Hub (North)', 'Central WH', 'Shop Display'];

  // DB Optimization: load all warehouse stock rows in a single batch query!
  const allExistingRows = await db('warehouse_stocks').select('inventory_id', 'warehouse_name');
  
  // Build a fast lookup map: inventory_id -> Set of existing warehouse names
  const existingMap = new Map<number, Set<string>>();
  for (const row of allExistingRows) {
    let set = existingMap.get(row.inventory_id);
    if (!set) {
      set = new Set<string>();
      existingMap.set(row.inventory_id, set);
    }
    set.add(row.warehouse_name);
  }

  const stockRowsToInsert: any[] = [];

  for (const item of items) {
    const existingNames = existingMap.get(item.id) || new Set<string>();
    const missingWarehouses = warehouses.filter(warehouseName => !existingNames.has(warehouseName));
    
    if (missingWarehouses.length > 0) {
      const stockRows = missingWarehouses.map(warehouseName => ({
        inventory_id: item.id,
        warehouse_name: warehouseName,
        stock: warehouseName === 'Main Factory (A-1)'
          ? Number(item.warehouse_stock ?? item.stock ?? 0)
          : warehouseName === 'Shop Display'
            ? Number(item.display_stock ?? 0)
            : 0,
      }));
      stockRowsToInsert.push(...stockRows);
    }
  }

  // Insert in chunks of 500 to stay within SQL variables limits
  if (stockRowsToInsert.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < stockRowsToInsert.length; i += chunkSize) {
      const chunk = stockRowsToInsert.slice(i, i + chunkSize);
      await db('warehouse_stocks').insert(chunk);
    }
    console.log(`Optimized Seeding: Batch inserted ${stockRowsToInsert.length} missing warehouse stock rows.`);
  }
}

// Check for corrupt SQLite file before initialization
const sqlitePath = path.join(process.cwd(), 'database.sqlite');
if (!isPostgres && fs.existsSync(sqlitePath)) {
  try {
    const tempDb = new Database(sqlitePath);
    tempDb.prepare('SELECT 1').raw().columns();
    tempDb.close();
    console.log('--- Database: Integrity check PASSED for SQLite file ---');
  } catch (err: any) {
    console.error('--- Database: Corrupt SQLite file detected on startup! ---', err);
    try {
      fs.unlinkSync(sqlitePath);
      console.log('--- Database: Corrupt SQLite file DELETED successfully on startup ---');
    } catch (unlinkErr) {
      console.error('--- Database: Failed to delete corrupt SQLite file ---', unlinkErr);
    }
  }
}

const db = knex({
  client: isPostgres ? 'pg' : 'better-sqlite3',
  connection: isPostgres 
    ? {
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        host: process.env.PGHOST,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        port: Number(process.env.PGPORT) || 5432,
        ssl: { rejectUnauthorized: false },
      }
    : {
        filename: path.join(process.cwd(), 'database.sqlite'),
      },
  useNullAsDefault: !isPostgres,
});

export async function initDb() {
  console.log('--- Database: Starting initialization ---');
  try {
    // Basic connection test
    console.log(`--- Database: Testing connection (Postgres: ${isPostgres}) ---`);
    await db.raw('SELECT 1').timeout(5000);
    console.log('--- Database: Connection successful ---');
  } catch (error: any) {
    console.error('--- Database: Connection FAILED ---', error);
    if (error?.code === 'ENOTFOUND' && error?.hostname && error.hostname.includes('supabase.co')) {
      console.error('\n🔴 SUPABASE CONNECTION ERROR:');
      console.error('Supabase has phased out IPv4 support for direct database connections.');
      console.error('Vercel serverless environments often fail to resolve the IPv6 hostname.');
      console.error('\n👉 FIX: Go to your Supabase Dashboard -> Project Settings -> Database');
      console.error('👉 Turn ON "Use connection pooling" and use the Transaction Pooler URL (Port 6543) instead of direct connection.');
      console.error(`👉 Current failing host: ${error.hostname}\n`);
    }
    throw error;
  }

  // Roles Table
  if (!(await db.schema.hasTable('roles'))) {
    await db.schema.createTable('roles', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.string('desc');
      table.integer('count').defaultTo(0);
      table.boolean('active').defaultTo(false);
      table.text('permissions'); // JSON stringified permissions
      table.timestamps(true, true);
    });

    // Seed initial roles
    await db('roles').insert([
      { id: 'admin', name: 'Admin', desc: 'Full access to all modules and settings', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Production', 'Sales', 'Purchases', 'Reports', 'Customers', 'Settings', 'Dashboard', 'Suppliers']) },
      { id: 'factory_manager', name: 'Factory Manager', desc: 'Production, raw material, factory inventory', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Production', 'Dashboard']) },
      { id: 'shop_manager', name: 'Shop Manager', desc: 'Shop sales, shop inventory, customers', count: 1, active: true, permissions: JSON.stringify(['Inventory', 'Sales', 'Customers', 'Dashboard']) },
      { id: 'accountant', name: 'Accountant', desc: 'Customer accounts, payments, reports', count: 1, active: true, permissions: JSON.stringify(['Reports', 'Customers', 'Sales', 'Dashboard']) },
      { id: 'sales_staff', name: 'Sales Staff', desc: 'Sales entry, customer records – limited access', count: 1, active: true, permissions: JSON.stringify(['Sales', 'Customers', 'Dashboard']) },
    ]);
  } else {
    // Migration: Update admin role permissions if needed or ensure all roles have Dashboard
    const roles = await db('roles').select('*');
    for (const role of roles) {
      const perms = JSON.parse(role.permissions || '[]');
      let updated = false;
      if (!perms.includes('Dashboard')) {
        perms.push('Dashboard');
        updated = true;
      }
      if (role.id === 'admin' && !perms.includes('Suppliers')) {
        perms.push('Suppliers');
        updated = true;
      }
      if (updated) {
        await db('roles').where({ id: role.id }).update({ permissions: JSON.stringify(perms) });
      }
    }
  }

  // Users Table
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email').unique().notNullable();
      table.string('username').unique().notNullable();
      table.string('password').notNullable().defaultTo('password123'); // Added password field
      table.string('role_id').references('id').inTable('roles');
      table.string('status').defaultTo('Active');
      table.timestamp('last_login');
      table.string('initials');
      table.string('color');
      table.timestamps(true, true);
    });

    // Seed initial users
    await db('users').insert([
      { name: 'System Admin', email: 'admin@sanitaryflow.com', username: 'admin', password: 'admin', role_id: 'admin', status: 'Active', initials: 'SA', color: 'bg-blue-100' },
      { name: 'Factory Manager', email: 'factory@sanitaryflow.com', username: 'factory', password: 'factory123', role_id: 'factory_manager', status: 'Active', initials: 'FM', color: 'bg-[#b5c8df]' },
      { name: 'Shop Manager', email: 'shop@sanitaryflow.com', username: 'shop', password: 'shop123', role_id: 'shop_manager', status: 'Active', initials: 'SM', color: 'bg-[#92ccff]' },
      { name: 'Senior Accountant', email: 'accountant@sanitaryflow.com', username: 'accountant', password: 'accountant123', role_id: 'accountant', status: 'Active', initials: 'AC', color: 'bg-emerald-100' },
      { name: 'Sales Representative', email: 'sales@sanitaryflow.com', username: 'sales', password: 'sales123', role_id: 'sales_staff', status: 'Active', initials: 'SR', color: 'bg-amber-100' },
    ]);
  } else {
    // Migration: Ensure the 5 requested users exist with correct credentials
    const usersToEnsure = [
      { name: 'System Admin', email: 'admin@sanitaryflow.com', username: 'admin', password: 'admin', role_id: 'admin', status: 'Active', initials: 'SA', color: 'bg-blue-100' },
      { name: 'Factory Manager', email: 'factory@sanitaryflow.com', username: 'factory', password: 'factory123', role_id: 'factory_manager', status: 'Active', initials: 'FM', color: 'bg-[#b5c8df]' },
      { name: 'Shop Manager', email: 'shop@sanitaryflow.com', username: 'shop', password: 'shop123', role_id: 'shop_manager', status: 'Active', initials: 'SM', color: 'bg-[#92ccff]' },
      { name: 'Senior Accountant', email: 'accountant@sanitaryflow.com', username: 'accountant', password: 'accountant123', role_id: 'accountant', status: 'Active', initials: 'AC', color: 'bg-emerald-100' },
      { name: 'Sales Representative', email: 'sales@sanitaryflow.com', username: 'sales', password: 'sales123', role_id: 'sales_staff', status: 'Active', initials: 'SR', color: 'bg-amber-100' },
    ];

    if (!(await db.schema.hasColumn('users', 'password'))) {
      await db.schema.alterTable('users', (table) => {
        table.string('password').notNullable().defaultTo('password123');
      });
    }

    for (const u of usersToEnsure) {
      const exists = await db('users').where({ username: u.username }).first();
      if (!exists) {
        await db('users').insert(u);
      } else {
        // Update password just in case it was changed/incorrect
        await db('users').where({ username: u.username }).update({ password: u.password });
      }
    }
  }

  // Inventory Table
  if (!(await db.schema.hasTable('inventory'))) {
    await db.schema.createTable('inventory', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('sku').unique().notNullable();
      table.string('category');
      table.integer('stock').defaultTo(0);
      table.integer('display_stock').defaultTo(0);
      table.integer('warehouse_stock').defaultTo(0);
      table.integer('minStock').defaultTo(10);
      table.float('price').defaultTo(0);
      table.string('status');
      table.text('description');
      table.string('brand');
      table.string('product_line');
      table.string('size');
      table.string('packing');
      table.string('unit');
      table.string('color');
      table.text('image');
      table.timestamps(true, true);
    });

    // Seed initial inventory
    // Removed old shop and raw material items as requested.
  }

  // Migration for inventory table
  if (!(await db.schema.hasColumn('inventory', 'display_stock'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.integer('display_stock').defaultTo(0);
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'warehouse_stock'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.integer('warehouse_stock').defaultTo(0);
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'description'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.text('description');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'brand'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('brand');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'product_line'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('product_line');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'size'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('size');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'packing'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('packing');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'unit'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('unit');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'color'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.string('color');
    });
  }
  if (!(await db.schema.hasColumn('inventory', 'image'))) {
    await db.schema.alterTable('inventory', (table) => {
      table.text('image');
    });
  }

  // Warehouse Stocks Table
  if (!(await db.schema.hasTable('warehouse_stocks'))) {
    await db.schema.createTable('warehouse_stocks', (table) => {
      table.increments('id').primary();
      table.integer('inventory_id').references('id').inTable('inventory').onDelete('CASCADE');
      table.string('warehouse_name').notNullable();
      table.integer('stock').defaultTo(0);
      table.timestamps(true, true);
    });

    // Seed initial distribution for the first item (omitted for clean state)
  }

  // DB Optimization: Avoid running sequential SKU checks on startup if database has already been fully seeded
  const countResult = await db('inventory').count('id as count').first();
  const inventoryCount = Number(countResult?.count || 0);

  if (inventoryCount >= 110) {
    console.log(`--- Seeding: skipping detailed SKU checks since ${inventoryCount} items are already in database ---`);
    await ensureWarehouseRowsForInventory();
  } else {
    await ensureWorldRehmatProducts();
    await ensureSuperMasterBlueFittings();
    await ensureSuperMasterGreenProducts();
    await ensureWarehouseRowsForInventory();
  }

  // Security Logs Table
  if (!(await db.schema.hasTable('audit_logs'))) {
    await db.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.string('user').notNullable();
      table.string('action').notNullable();
      table.string('module').notNullable();
      table.string('ip');
      table.text('details'); // JSON metadata for before/after states
      table.timestamp('timestamp').defaultTo(db.fn.now());
    });
  }

  // System Backups Table
  if (!(await db.schema.hasTable('backups'))) {
    await db.schema.createTable('backups', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('size').notNullable();
      table.string('status').notNullable();
      table.timestamp('date').defaultTo(db.fn.now());
    });
    
    // Seed initial backups
    await db('backups').insert([
      { name: 'SF_AUTO_20231024_0400.sql.gz', size: '1.42 GB', status: 'Successful', date: new Date('2023-10-24T04:00:00Z') },
      { name: 'SF_AUTO_20231023_0400.sql.gz', size: '1.39 GB', status: 'Successful', date: new Date('2023-10-23T04:00:00Z') },
      { name: 'SF_AUTO_20231022_0400.sql.gz', size: '--', status: 'Failed', date: new Date('2023-10-22T04:00:00Z') },
      { name: 'SF_MANUAL_DB_UPGRADE_v2.sql.gz', size: '1.38 GB', status: 'Successful', date: new Date('2023-10-21T23:20:00Z') }
    ]);
  }

  // Production Batches
  if (!(await db.schema.hasTable('production_batches'))) {
    await db.schema.createTable('production_batches', (table) => {
      table.increments('id').primary();
      table.string('batch_number').unique().notNullable();
      table.integer('product_id').unsigned().references('id').inTable('inventory');
      table.integer('target_qty').notNullable();
      table.integer('actual_qty').defaultTo(0);
      table.string('line').defaultTo('Main Line');
      table.string('status').defaultTo('Scheduled');
      table.timestamp('started_at');
      table.timestamp('completed_at');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    // Seed production batches (omitted for clean state)
  }

  if (isPostgres && (await db.schema.hasTable('production_batches'))) {
    try {
      // Check column type for product_id
      const colInfo = await db('production_batches').columnInfo('product_id');
      if (colInfo.type === 'character varying' || colInfo.type === 'varchar' || colInfo.type === 'string') {
        console.log('Migrating production_batches.product_id from string to integer...');
        await db.raw('ALTER TABLE production_batches ALTER COLUMN product_id TYPE integer USING product_id::integer');
      }
    } catch (e) {
      console.warn('Migration failed for production_batches.product_id:', e);
    }
  }

  // Damage Reports Table
  if (!(await db.schema.hasTable('damage_reports'))) {
    await db.schema.createTable('damage_reports', (table) => {
      table.increments('id').primary();
      table.string('type').notNullable();
      table.integer('quantity').notNullable();
      table.text('notes');
      table.timestamp('report_date').defaultTo(db.fn.now());
    });

    await db('damage_reports').insert([
      { type: 'Thermal Cracks', quantity: 142, notes: 'Initial seed' },
      { type: 'Glaze Defects', quantity: 58, notes: 'Initial seed' }
    ]);
  }

  // Machine Maintenance Table
  if (!(await db.schema.hasTable('machine_maintenance'))) {
    await db.schema.createTable('machine_maintenance', (table) => {
      table.increments('id').primary();
      table.string('machine_id').notNullable();
      table.string('machine_name').notNullable();
      table.date('last_service').notNullable();
      table.date('next_service').notNullable();
      table.float('uptime_percentage').defaultTo(100);
      table.string('status').notNullable();
      table.string('operator').notNullable();
      table.string('avatar_url');
    });

    await db('machine_maintenance').insert([
      { machine_id: 'EXT-901-A', machine_name: 'Extruder', last_service: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], uptime_percentage: 99.2, status: 'OPTIMAL', operator: 'K. Robinson', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=faces' },
      { machine_id: 'GLZ-402-B', machine_name: 'Glazing', last_service: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], uptime_percentage: 94.8, status: 'RUNNING', operator: 'M. Chen', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=32&h=32&fit=crop&crop=faces' },
      { machine_id: 'KLN-104-X', machine_name: 'Kiln', last_service: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], uptime_percentage: 0.0, status: 'CRITICAL', operator: 'Maintenance Team', avatar_url: null },
      { machine_id: 'M-04', machine_name: 'Packing', last_service: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], next_service: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0], uptime_percentage: 88.5, status: 'IDLE', operator: 'S. Miller', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=faces' },
    ]);
  }

  // Suppliers
  if (!(await db.schema.hasTable('suppliers'))) {
    await db.schema.createTable('suppliers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('company');
      table.string('contact_person');
      table.string('email');
      table.string('phone');
      table.string('category');
      table.text('address');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('suppliers').insert([
      { name: 'Clay Tech', company: 'Clay Tech Ceramics', contact_person: 'Robert Brown', email: 'sales@claytech.com', phone: '+1 555 123 4567', category: 'Raw Material', address: '123 Clay Rd, Stroke-on-Trent' },
      { name: 'Metal Works', company: 'Precision Metals', contact_person: 'Alice Green', email: 'alice@metalworks.biz', phone: '+1 555 987 6543', category: 'Hardware', address: '45 Industrial Pkwy, Manchester' },
    ]);
  }

  // Migration for suppliers table
  const supplierCols = [
    { name: 'company', type: 'string' },
    { name: 'address', type: 'text' }
  ];

  for (const col of supplierCols) {
    if (!(await db.schema.hasColumn('suppliers', col.name))) {
      await db.schema.alterTable('suppliers', (table) => {
        if (col.type === 'string') table.string(col.name);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Customers
  if (!(await db.schema.hasTable('customers'))) {
    await db.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('company');
      table.string('business_type');
      table.string('tax_id');
      table.float('credit_limit').defaultTo(0);
      table.string('payment_terms');
      table.string('contact_person');
      table.string('email');
      table.string('phone');
      table.string('city');
      table.float('opening_balance').defaultTo(0);
      table.text('billing_address');
      table.text('shipping_address');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('customers').insert([
      { name: 'John Doe', company: 'Apex Construction', email: 'john@apex.com', city: 'London', phone: '+44 20 7946 0958' },
      { name: 'Jane Smith', company: 'Global Marine', email: 'jane@global.com', city: 'Birmingham', phone: '+44 12 1496 0345' },
      { name: 'Ahmed Khan', company: 'Modern Build Ltd', email: 'ahmed@modernbuild.co.uk', city: 'Manchester', phone: '+44 16 1496 0123' },
      { name: 'Sarah Wilson', company: 'Interiors UK', email: 'sarah@interiorsuk.com', city: 'Liverpool', phone: '+44 15 1496 0789' },
    ]);
  }

  // Migration for customers table
  const columnsToCheck = [
    { name: 'business_type', type: 'string' },
    { name: 'tax_id', type: 'string' },
    { name: 'credit_limit', type: 'float', default: 0 },
    { name: 'payment_terms', type: 'string' },
    { name: 'contact_person', type: 'string' },
    { name: 'billing_address', type: 'text' },
    { name: 'shipping_address', type: 'text' },
    { name: 'city', type: 'string' },
    { name: 'opening_balance', type: 'float', default: 0 }
  ];

  for (const col of columnsToCheck) {
    if (!(await db.schema.hasColumn('customers', col.name))) {
      await db.schema.alterTable('customers', (table) => {
        if (col.type === 'string') table.string(col.name);
        else if (col.type === 'float') table.float(col.name).defaultTo(col.default ?? 0);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Sales Orders
  if (!(await db.schema.hasTable('sales_orders'))) {
    await db.schema.createTable('sales_orders', (table) => {
      table.increments('id').primary();
      table.string('order_number').unique().notNullable();
      table.integer('customer_id').references('id').inTable('customers');
      table.float('total_amount').defaultTo(0);
      table.float('paid_amount').defaultTo(0);
      table.float('discount').defaultTo(0);
      table.string('status').defaultTo('Draft');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  } else {
    if (!(await db.schema.hasColumn('sales_orders', 'paid_amount'))) {
      await db.schema.alterTable('sales_orders', (table) => {
        table.float('paid_amount').defaultTo(0);
      });
    }
    if (!(await db.schema.hasColumn('sales_orders', 'discount'))) {
      await db.schema.alterTable('sales_orders', (table) => {
        table.float('discount').defaultTo(0);
      });
    }
  }

  // Sales Order Items
  if (!(await db.schema.hasTable('sales_order_items'))) {
    await db.schema.createTable('sales_order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').references('id').inTable('sales_orders');
      table.integer('product_id').references('id').inTable('inventory');
      table.integer('qty').notNullable();
      table.float('price').notNullable();
    });
  }

  // Seed initial orders (omitted for clean state)
  const orderCount = await db('sales_orders').count({ count: '*' }).first();

  // Update existing production_batches with new columns
  const productionCols = [
    { name: 'wastage_qty', type: 'integer', default: 0 },
    { name: 'damaged_qty', type: 'integer', default: 0 },
    { name: 'notes', type: 'text' },
    { name: 'category', type: 'string' }
  ];

  for (const col of productionCols) {
    if (!(await db.schema.hasColumn('production_batches', col.name))) {
      await db.schema.alterTable('production_batches', (table) => {
        if (col.type === 'integer') table.integer(col.name).defaultTo(col.default ?? 0);
        else if (col.type === 'string') table.string(col.name);
        else if (col.type === 'text') table.text(col.name);
      });
    }
  }

  // Production Material Consumption
  if (!(await db.schema.hasTable('production_material_consumption'))) {
    await db.schema.createTable('production_material_consumption', (table) => {
      table.increments('id').primary();
      table.integer('batch_id').references('id').inTable('production_batches').onDelete('CASCADE');
      table.integer('inventory_id').references('id').inTable('inventory'); // raw material
      table.integer('qty_consumed').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Purely financial ledger
  if (!(await db.schema.hasTable('ledger'))) {
    await db.schema.createTable('ledger', (table) => {
      table.increments('id').primary();
      table.string('account_type').notNullable(); 
      table.integer('customer_id').references('id').inTable('customers').nullable();
      table.integer('supplier_id').references('id').inTable('suppliers').nullable();
      table.string('reference_id').notNullable(); 
      table.float('debit').defaultTo(0);
      table.float('credit').defaultTo(0);
      table.string('description');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db('ledger').insert([
      { account_type: 'Sales', customer_id: 1, reference_id: 'SO-1001', debit: 0, credit: 12500.00, description: 'Payment for SO-1001' },
      { account_type: 'Operations', reference_id: 'OP-001', debit: 3500.00, credit: 0, description: 'Utilities bill' },
    ]);
  }

  // Migration for ledger table
  if (!(await db.schema.hasColumn('ledger', 'customer_id'))) {
    await db.schema.alterTable('ledger', (table) => {
      table.integer('customer_id').references('id').inTable('customers').nullable();
    });
  }
  if (!(await db.schema.hasColumn('ledger', 'supplier_id'))) {
    await db.schema.alterTable('ledger', (table) => {
      table.integer('supplier_id').references('id').inTable('suppliers').nullable();
    });
  }

  // Purchase Orders
  if (!(await db.schema.hasTable('purchase_orders'))) {
    await db.schema.createTable('purchase_orders', (table) => {
      table.increments('id').primary();
      table.string('po_number').unique().notNullable();
      table.integer('supplier_id').references('id').inTable('suppliers');
      table.float('total_cost').defaultTo(0);
      table.float('paid_amount').defaultTo(0);
      table.string('status').defaultTo('Pending');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  } else {
    if (!(await db.schema.hasColumn('purchase_orders', 'paid_amount'))) {
      await db.schema.alterTable('purchase_orders', (table) => {
        table.float('paid_amount').defaultTo(0);
      });
    }
  }

  // Purchase Items
  if (!(await db.schema.hasTable('purchase_items'))) {
    await db.schema.createTable('purchase_items', (table) => {
      table.increments('id').primary();
      table.integer('po_id').references('id').inTable('purchase_orders');
      table.integer('product_id').references('id').inTable('inventory');
      table.integer('qty').notNullable();
      table.float('cost').notNullable();
    });
  }
  // Stock Transfers Table
  if (!(await db.schema.hasTable('stock_transfers'))) {
    await db.schema.createTable('stock_transfers', (table) => {
      table.increments('id').primary();
      table.string('transfer_number').unique().notNullable();
      table.string('source').notNullable();
      table.string('destination').notNullable();
      table.string('priority').defaultTo('NORMAL');
      table.string('transport_type').defaultTo('in-house');
      table.string('expected_arrival');
      table.text('notes');
      table.string('status').defaultTo('DRAFT');
      table.text('items_preview'); // JSON string for quick view in list
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Ensure there's a seed record if empty
  const transferCount = await db('stock_transfers').count({ count: '*' }).first();
  if (transferCount && Number(transferCount.count) === 0) {
    // Seed with a null preview or empty preview since ID 1 doesn't exist
    await db('stock_transfers').insert({
      transfer_number: 'TRF-INIT-01',
      source: 'Main Factory (A-1)',
      destination: 'Shop Display',
      priority: 'NORMAL',
      status: 'RECEIVED',
      items_preview: JSON.stringify([]),
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });
  }

    // Stock Transfer Items Table
    if (!(await db.schema.hasTable('stock_transfer_items'))) {
      await db.schema.createTable('stock_transfer_items', (table) => {
        table.increments('id').primary();
        table.integer('transfer_id').references('id').inTable('stock_transfers').onDelete('CASCADE');
        table.integer('inventory_id').references('id').inTable('inventory');
        table.integer('qty').notNullable();
        table.timestamps(true, true);
      });
    }

  if (!(await db.schema.hasTable('labour'))) {
    await db.schema.createTable('labour', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('cnic').notNullable();
      table.string('address').notNullable();
      table.string('mobile_no').notNullable();
      table.string('designation').notNullable();
      table.decimal('salary', 12, 2).notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  if (!(await db.schema.hasTable('labour_advances'))) {
    await db.schema.createTable('labour_advances', (table) => {
      table.increments('id').primary();
      table.integer('labour_id').references('id').inTable('labour').onDelete('CASCADE');
      table.decimal('amount', 12, 2).notNullable();
      table.string('date_text').notNullable();
      table.string('description').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  if (await db.schema.hasTable('labour_advances')) {
    const hasDescription = await db.schema.hasColumn('labour_advances', 'description');
    if (!hasDescription) {
      await db.schema.alterTable('labour_advances', (table) => {
        table.string('description').nullable();
      });
    }
  }

    // AUTOMATIC CLEANUP FOR REDUNDANT ITEMS
    const skusToDelete = [
      'CPS-001',
      'CPS-001-W',
      'CPS-001-I',
      'CMT-042',
      'DFT-099',
      'DFT-099-W',
      'DFT-099-I',
      'RAW-K4',
      'RAW-G82',
      'RAW-BF12',
      'FK-001',
      'WMB-202'
    ];

    try {
      const itemsToDelete = await db('inventory').whereIn('sku', skusToDelete).select('id');
      const idsToDelete = itemsToDelete.map((item: any) => item.id);

      if (idsToDelete.length > 0) {
        console.log('Cleaning up depending data for redundant items:', idsToDelete);
        
        await db('warehouse_stocks').whereIn('inventory_id', idsToDelete).delete();
        if (await db.schema.hasTable('production_material_consumption')) {
          await db('production_material_consumption').whereIn('inventory_id', idsToDelete).delete();
        }
        if (await db.schema.hasTable('sales_order_items')) {
          await db('sales_order_items').whereIn('product_id', idsToDelete).delete();
        }
        if (await db.schema.hasTable('purchase_items')) {
          await db('purchase_items').whereIn('product_id', idsToDelete).delete();
        }
        if (await db.schema.hasTable('stock_transfer_items')) {
          await db('stock_transfer_items').whereIn('inventory_id', idsToDelete).delete();
        }
        if (await db.schema.hasTable('production_batches')) {
          await db('production_batches').whereIn('product_id', idsToDelete).delete();
        }

        // Drop the products from inventory
        await db('inventory').whereIn('id', idsToDelete).delete();
        console.log('Cleanup completed successfully.');
      }
    } catch (cleanupErr) {
      console.warn('Silent warning down database cleanup of old items:', cleanupErr);
    }
  }

export default db;
