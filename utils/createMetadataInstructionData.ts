import { Buffer } from 'buffer';

export function createMetadataInstructionData(
  name: string,
  symbol: string,
  uri: string
): Buffer {
  // Ensure the URI is using HTTPS gateway
  const formattedUri = uri.startsWith('ipfs://')
    ? uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : uri;
  
  // Create metadata instruction
  const METADATA_INSTRUCTION = 33; // CreateMetadataAccountV3 instruction number
  
  const buffer = Buffer.alloc(1000); // Adjust size as needed
  let offset = 0;

  // Instruction discriminator
  buffer.writeUInt8(METADATA_INSTRUCTION, offset);
  offset += 1;

  // Write name length and name
  buffer.writeUInt32LE(name.length, offset);
  offset += 4;
  buffer.write(name, offset);
  offset += name.length;

  // Write symbol length and symbol
  buffer.writeUInt32LE(symbol.length, offset);
  offset += 4;
  buffer.write(symbol, offset);
  offset += symbol.length;

  // Write uri length and uri (using formattedUri)
  buffer.writeUInt32LE(formattedUri.length, offset);
  offset += 4;
  buffer.write(formattedUri, offset);
  offset += formattedUri.length;

  // Seller fee basis points (0)
  buffer.writeUInt16LE(0, offset);
  offset += 2;

  // Creators (null) - write 0
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Collection (null) - write 0
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Uses (null) - write 0
  buffer.writeUInt8(0, offset);
  offset += 1;

  // Is mutable
  buffer.writeUInt8(1, offset);
  offset += 1;

  // Collection details (null) - write 0
  buffer.writeUInt8(0, offset);
  offset += 1;

  return buffer.slice(0, offset);
} 