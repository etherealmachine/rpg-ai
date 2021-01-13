class ApplicationController < ActionController::Base
  protect_from_forgery unless: -> { request.headers["Authorization"]&.start_with? 'Bearer' }
end
