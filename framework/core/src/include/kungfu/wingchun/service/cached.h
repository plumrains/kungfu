#ifndef WINGCHUN_FEED_H
#define WINGCHUN_FEED_H

#include <kungfu/wingchun/broker/client.h>
#include <kungfu/yijinjing/cache/runtime.h>
#include <kungfu/yijinjing/io.h>
#include <kungfu/yijinjing/log.h>
#include <kungfu/yijinjing/practice/apprentice.h>
#include <kungfu/yijinjing/practice/profile.h>

namespace kungfu::wingchun::service {

using ProfileDataTypesType = decltype(longfist::ProfileDataTypes);
using ProfileStateMapType = decltype(longfist::build_state_map(longfist::ProfileDataTypes));
typedef yijinjing::cache::type_bank<ProfileDataTypesType, ProfileStateMapType> ProfileStateBank;

class CacheD : public yijinjing::practice::apprentice {
public:
  explicit CacheD(yijinjing::data::locator_ptr locator, longfist::enums::mode m, bool low_latency = false);

protected:
  void on_start() override;

  void on_react() override;

  void on_active() override;

  static constexpr auto profile_get_all = [](auto &profile, auto &receiver) {
    boost::hana::for_each(longfist::ProfileDataTypes, [&](auto it) {
      auto type = boost::hana::second(it);
      using DataType = typename decltype(+type)::type;
      int get_all_count = 0;
      while (get_all_count++ < 10) {
        try {
          for (const auto &data : profile.get_all(DataType{})) {
            auto s = state(0, 0, 0, data);
            receiver << s;
          }
          break;
        } catch (const std::exception &e) {
          SPDLOG_ERROR("Unexpected exception by profile_get_all {}", e.what());
        }
      }
    });
  };

private:
  std::unordered_map<uint32_t, yijinjing::cache::shift> app_cache_shift_ = {};
  yijinjing::cache::bank feed_bank_;
  yijinjing::practice::profile profile_;
  ProfileStateBank profile_bank_ = ProfileStateBank(longfist::ProfileDataTypes);

  void on_location(const event_ptr &event);

  void handle_cached_feeds();

  void handle_profile_feeds();

  void mark_request_cached_done(uint32_t dest_id);

  void inspect_channel(int64_t trigger_time, const longfist::types::Channel &channel);

  void register_cache_shift(const longfist::types::Channel &channel);

  void deregister_cache_shift(const longfist::types::Deregister &deregister_data);

  void on_cache_reset(const event_ptr &event);

  void ensure_cached_storage(uint32_t source_id, uint32_t dest_id);

  void feed(const event_ptr &event);
};

} // namespace kungfu::wingchun::service

#endif // WINGCHUN_FEED_H
