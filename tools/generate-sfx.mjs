import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "assets", "sfx");
const sampleRate = 44100;
let seed = 0x5a17c0de;

const random = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 0xffffffff;
};
const noise = () => random() * 2 - 1;
const clamp = (value) => Math.max(-1, Math.min(1, value));
const decay = (time, duration, power = 2) => Math.pow(Math.max(0, 1 - time / duration), power);
const attack = (time, seconds = 0.008) => Math.min(1, time / seconds);

const writeWav = async (name, duration, sample) => {
  const count = Math.floor(sampleRate * duration);
  const dataSize = count * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < count; index += 1) {
    const time = index / sampleRate;
    buffer.writeInt16LE(Math.round(clamp(sample(time, duration)) * 32767), 44 + index * 2);
  }
  await fs.writeFile(path.join(output, name), buffer);
};

await fs.mkdir(output, { recursive: true });

await writeWav("slash.wav", 0.22, (time, duration) => {
  const frequency = 1250 - 900 * (time / duration);
  const tone = Math.sin(2 * Math.PI * frequency * time);
  return attack(time) * decay(time, duration, 1.7) * (tone * 0.42 + noise() * 0.28);
});

await writeWav("impact.wav", 0.28, (time, duration) => {
  const body = Math.sin(2 * Math.PI * (105 - 55 * time / duration) * time);
  return attack(time, 0.002) * decay(time, duration, 3) * (body * 0.72 + noise() * 0.34);
});

await writeWav("dash.wav", 0.3, (time, duration) => {
  const sweep = Math.sin(2 * Math.PI * (420 + 780 * time / duration) * time);
  return attack(time, 0.015) * decay(time, duration, 1.4) * (sweep * 0.35 + noise() * 0.22);
});

await writeWav("pickup.wav", 0.48, (time, duration) => {
  const notes = [659.25, 830.61, 987.77];
  const note = notes[Math.min(notes.length - 1, Math.floor(time / 0.12))];
  return decay(time, duration, 1.3) *
    (Math.sin(2 * Math.PI * note * time) * 0.34 + Math.sin(2 * Math.PI * note * 2 * time) * 0.12);
});

await writeWav("boss-roar.wav", 0.85, (time, duration) => {
  const pulse = Math.sin(2 * Math.PI * (72 + Math.sin(time * 19) * 14) * time);
  return attack(time, 0.04) * decay(time, duration, 1.1) * (pulse * 0.7 + noise() * 0.17);
});

console.log(`Generated five sound effects in ${output}`);
