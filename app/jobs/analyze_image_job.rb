class AnalyzeImageJob < ApplicationJob
  queue_as :default

  def perform(model, image_attr)
    model.send(image_attr).analyze
  end
end