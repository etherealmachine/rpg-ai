class TagsController < ApplicationController
  def index
    @tags = ActsAsTaggableOn::Tag.all
    respond_to do |format| 
      format.json { render json: @tags }
    end 
  end
end