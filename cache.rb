class FifoCache
  @@size
  
  
  def initialize(size)
    @items = Array.new()
    @@size = size
  end

  def size()
    @@size
  end

  def data()
    @items.to_enum
  end
  
  def get(at)
    if at.is_a? Integer
      @items[at]
    else
      raise "Argument must be integer"
    end
  end
  
  def add(msg)
    if @items.size > @@size
      @items.shift
    end
    self.add_front(msg)
  end

  private

  def add_front(item)
    @items.push(item)
  end

  def add_rear(item)
    @items.unshift(item)
  end

  def remove_front
    @items.pop
  end
end
