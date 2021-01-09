class TilemapChannel < ApplicationCable::Channel
  def subscribed
    @tilemap = Tilemap.find(params[:tilemap_id])
    stream_for @tilemap
  end

  def receive(data)
    TilemapChannel.broadcast_to(@tilemap, data)
  end
end