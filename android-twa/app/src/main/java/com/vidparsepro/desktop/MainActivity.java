package com.vidparsepro.desktop;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import org.mozilla.geckoview.GeckoRuntime;
import org.mozilla.geckoview.GeckoSession;
import org.mozilla.geckoview.GeckoView;

public class MainActivity extends AppCompatActivity {
  private GeckoSession session;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    GeckoView geckoView = findViewById(R.id.gecko_view);
    GeckoRuntime runtime = GeckoRuntime.create(this);

    session = new GeckoSession();
    session.open(runtime);
    geckoView.setSession(session);
    session.loadUri("https://vidprase.eray.top/settings?client=android");
  }

  @Override
  protected void onDestroy() {
    if (session != null) {
      session.close();
      session = null;
    }
    super.onDestroy();
  }
}
