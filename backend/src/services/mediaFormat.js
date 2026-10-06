// Header/container identification, not a malware scan or complete media decode.
// Never forward the caller's filename/MIME to the provider as trusted metadata.
function mediaFormat(buffer, kind) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  const ascii = (start,end) => buffer.toString('ascii',start,end);
  let format;
  if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && buffer.length >= 24 && ascii(12,16) === 'IHDR') format = ['media','png','image/png'];
  else if (['GIF87a','GIF89a'].includes(ascii(0,6))) format = ['media','gif','image/gif'];
  else if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) format = ['media','jpg','image/jpeg'];
  else if (ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP') format = ['media','webp','image/webp'];
  else if (ascii(4,8) === 'ftyp' && ['isom','iso2','mp41','mp42','avc1','M4V ','dash'].includes(ascii(8,12))) format = ['media','mp4','video/mp4'];
  else if (ascii(0,4) === 'RIFF' && ascii(8,12) === 'WAVE') format = ['audio','wav','audio/wav'];
  else if (ascii(0,4) === 'OggS') format = ['audio','ogg','audio/ogg'];
  else if (ascii(0,3) === 'ID3' || (buffer[0] === 255 && (buffer[1] & 0xe0) === 0xe0 && (buffer[1] & 0x06) !== 0 && (buffer[2] & 0xf0) !== 0xf0)) format = ['audio','mp3','audio/mpeg'];
  return format?.[0] === kind ? { extension:format[1], mime:format[2] } : null;
}
module.exports = { mediaFormat };
