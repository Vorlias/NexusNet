--!strict
local BufferWriter = {}
BufferWriter.__index = BufferWriter
type BufferWriterProperties = {
    _buffer: buffer,
    _cursor: number,
    _size: number,
}
export type BufferWriter = setmetatable<BufferWriterProperties, typeof(BufferWriter)>

function BufferWriter.new(initialSize: number): BufferWriter
    local self: BufferWriterProperties = {
        _buffer = buffer.create(if initialSize then initialSize else 8),
        _cursor = 0,
        _size = 0
    };
    setmetatable(self, BufferWriter)
    return self
end

function BufferWriter.ResizeTo(self: BufferWriter, size: number): ()
    self._size = math.max(self._size, size)

    if size < buffer.len(self._buffer) then
        return
    end

    local powerOfTwo = math.log(size, 2)
    if math.floor(powerOfTwo) ~= powerOfTwo then
        size = 2 ^ (math.floor(powerOfTwo) + 1)
    end

    local oldBuffer = self._buffer
    local newBuffer = buffer.create(size)
    buffer.copy(newBuffer, 0, oldBuffer, 0)
    self._buffer = newBuffer
end

function BufferWriter.WriteInt8(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 1)
    buffer.writei8(self._buffer, self._cursor, value)
    self._cursor += 1

    return self
end

function BufferWriter.WriteInt16(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 2)
    buffer.writei16(self._buffer, self._cursor, value)
    self._cursor += 2

    return self
end

function BufferWriter.WriteInt32(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 4)
    buffer.writei32(self._buffer, self._cursor, value)
    self._cursor += 4

    return self
end

function BufferWriter.WriteUInt8(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 1)
    buffer.writeu8(self._buffer, self._cursor, value)
    self._cursor += 1

    return self
end

function BufferWriter.WriteUInt16(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 2)
    buffer.writeu16(self._buffer, self._cursor, value)
    self._cursor += 2

    return self
end

function BufferWriter.WriteUInt32(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 4)
    buffer.writeu32(self._buffer, self._cursor, value)
    self._cursor += 4

    return self
end

function BufferWriter.WriteFloat32(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 4)
    buffer.writef32(self._buffer, self._cursor, value)
    self._cursor += 4

    return self
end

function BufferWriter.WriteFloat64(self: BufferWriter, value: number): BufferWriter
    self:ResizeTo(self._cursor + 8)
    buffer.writef64(self._buffer, self._cursor, value)
    self._cursor += 8

    return self
end

function BufferWriter.WriteBoolean(self: BufferWriter, value: boolean): BufferWriter
    self.WriteUInt8(self, if value then 1 else 0)
    return self
end

function BufferWriter.WriteString(self: BufferWriter, value: string): BufferWriter
    local len = #value
    local size = len + 4
    self:ResizeTo(self._cursor + size)
    buffer.writeu32(self._buffer, self._cursor, len)
    buffer.writestring(self._buffer, self._cursor + 4, value, len)
    self._cursor += size

    return self
end

function BufferWriter.ToBuffer(self: BufferWriter): buffer
    return self._buffer
end

function BufferWriter.ToString(self: BufferWriter): string
    return buffer.tostring(self._buffer)
end

return BufferWriter