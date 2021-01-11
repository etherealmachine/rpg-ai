# == Schema Information
#
# Table name: tilemap_objects
#
#  id               :integer          not null, primary key
#  tilemap_id       :integer
#  tilemap_layer_id :integer
#  name             :string
#  x                :integer
#  y                :integer
#  width            :integer
#  height           :integer
#  properties       :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#
class TilemapObject < ApplicationRecord
  belongs_to :tilemap
  belongs_to :tilemap_layer

  def as_json(options={})
    {
      id: id,
      name: name,
      x: x,
      y: y,
      width: width,
      height: height,
      properties: JSON.parse(properties).map { |k, v| { name: k, value: v } },
    }
  end

  def as_xml(frag)
    frag.object(id: id, name: name, x: x, y: y, width: width, height: height) do |obj|
      props = JSON.parse(properties)
      unless props.empty?
        obj.properties do |props_node|
          props.each do |k, v|
            props_node.property(name: k, value: v)
          end
        end
      end
    end
  end

end
